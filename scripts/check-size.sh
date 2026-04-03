#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$REPO_ROOT/release.config.json"

# ---------- preflight ----------

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Error: required tool "%s" is not installed or not on PATH.\n' "$1" >&2
    exit 1
  fi
}

for cmd in jq gzip find wc awk mktemp; do
  require_cmd "$cmd"
done

if ! command -v md5 >/dev/null 2>&1 && ! command -v md5sum >/dev/null 2>&1; then
  printf 'Error: required hashing tool not found. Install either "md5" or "md5sum".\n' >&2
  exit 1
fi

# ---------- helpers ----------

parse_kb() {
  # "6 KB" → 6000, "2.5 KB" → 2500
  local num="${1%% *}"
  awk -v n="$num" 'BEGIN { printf "%d", n * 1000 }'
}

format_kb() {
  # bytes → "5.2 KB"
  awk -v b="$1" 'BEGIN { printf "%.1f KB", b / 1000 }'
}

# ---------- portable key-value store using temp files ----------
# Bash 3.2 on macOS lacks associative arrays, so we use temp files.

_KVDIR="$(mktemp -d)"
trap 'rm -rf "$_KVDIR"' EXIT

_kv_path() {
  local ns="$1" key="$2"
  local hash
  hash="$(printf '%s' "$key" | md5 2>/dev/null || printf '%s' "$key" | md5sum | cut -d' ' -f1)"
  printf '%s/%s/%s' "$_KVDIR" "$ns" "$hash"
}

kv_set() {
  local ns="$1" key="$2" val="$3"
  mkdir -p "$_KVDIR/$ns"
  local p
  p="$(_kv_path "$ns" "$key")"
  printf '%s' "$val" > "$p"
}

kv_get() {
  local p
  p="$(_kv_path "$1" "$2")"
  if [[ -f "$p" ]]; then
    cat "$p"
  fi
}

kv_has() {
  local p
  p="$(_kv_path "$1" "$2")"
  [[ -f "$p" ]]
}

# ---------- build name → directory map ----------

ALL_PKG_NAMES=()

for pkg_json in "$REPO_ROOT"/packages/*/package.json; do
  dir="$(dirname "$pkg_json")"
  name="$(jq -r '.name' "$pkg_json")"
  kv_set namedir "$name" "$dir"
  ALL_PKG_NAMES+=("$name")
done

# ---------- read bundleSize config ----------

BUNDLE_KEYS=()
while IFS= read -r key; do
  BUNDLE_KEYS+=("$key")

  limit="$(jq -r ".bundleSize[\"$key\"].limit" "$CONFIG")"
  kv_set cfglimit "$key" "$limit"

  ns="$(jq -r ".bundleSize[\"$key\"].nsLimit // empty" "$CONFIG")"
  kv_set cfgnslimit "$key" "${ns:-}"

  ext_json="$(jq -r ".bundleSize[\"$key\"].ext // null" "$CONFIG")"
  if [[ "$ext_json" == "null" ]]; then
    kv_set cfgext "$key" ".js"
  else
    exts="$(echo "$ext_json" | jq -r '.[]' | tr '\n' ' ')"
    kv_set cfgext "$key" "${exts% }"
  fi
done < <(jq -r '.bundleSize | keys[]' "$CONFIG")

# ---------- resolve in-repo deps for each package ----------

for pkg_json in "$REPO_ROOT"/packages/*/package.json; do
  name="$(jq -r '.name' "$pkg_json")"
  deps_raw="$(jq -r '.dependencies // {} | keys[]' "$pkg_json" 2>/dev/null || true)"
  in_repo=""
  for dep in $deps_raw; do
    if kv_has namedir "$dep"; then
      in_repo="${in_repo}${dep}"$'\n'
    fi
  done
  kv_set pkgdeps "$name" "$in_repo"
done

# ---------- measure gzipped size ----------

measure_size() {
  local name="$1"

  # Check cache
  if kv_has sizecache "$name"; then
    kv_get sizecache "$name"
    return
  fi

  local dir
  dir="$(kv_get namedir "$name")"
  local dist_dir="$dir/dist"

  # Determine extensions
  local exts
  if kv_has cfgext "$name"; then
    exts="$(kv_get cfgext "$name")"
  else
    exts=".js"
  fi

  if [[ ! -d "$dist_dir" ]]; then
    printf 'Error: dist directory not found for "%s" at %s\n' "$name" "$dist_dir" >&2
    printf 'Run "pnpm run build" first.\n' >&2
    exit 1
  fi

  local files=()
  for ext in $exts; do
    while IFS= read -r -d '' f; do
      local base
      base="$(basename "$f")"
      # Exclude .map, .d.ts, .d.cts, .global.js, metafile-*
      case "$base" in
        *.map) continue ;;
        *.d.ts) continue ;;
        *.d.cts) continue ;;
        *.global.js) continue ;;
        metafile-*) continue ;;
      esac
      files+=("$f")
    done < <(find "$dist_dir" -maxdepth 1 -type f -name "*${ext}" -print0 2>/dev/null)
  done

  local bytes=0
  if [[ ${#files[@]} -gt 0 ]]; then
    bytes="$(cat "${files[@]}" | gzip -c | wc -c | tr -d ' ')"
  fi

  kv_set sizecache "$name" "$bytes"
  echo "$bytes"
}

# ---------- resolve namespace (transitive in-repo) deps via BFS ----------

resolve_ns_deps() {
  local root="$1"
  local visited=""
  local queue=""

  _is_visited() {
    [[ -n "$visited" ]] && echo "$visited" | grep -qxF "$1"
  }

  # seed with direct in-repo deps
  local direct_deps
  direct_deps="$(kv_get pkgdeps "$root")"
  for dep in $direct_deps; do
    [[ -z "$dep" ]] && continue
    if ! _is_visited "$dep"; then
      visited="${visited}${dep}"$'\n'
      queue="${queue}${dep}"$'\n'
    fi
  done

  while [[ -n "$queue" ]]; do
    local current
    current="$(echo "$queue" | head -1)"
    queue="$(echo "$queue" | tail -n +2)"
    [[ -z "$current" ]] && continue

    local cur_deps
    cur_deps="$(kv_get pkgdeps "$current")"
    for dep in $cur_deps; do
      [[ -z "$dep" ]] && continue
      if ! _is_visited "$dep"; then
        visited="${visited}${dep}"$'\n'
        queue="${queue}${dep}"$'\n'
      fi
    done
  done

  echo "$visited"
}

# ---------- main ----------

JSON_MODE=false
if [[ "${1:-}" == "--json" ]]; then
  JSON_MODE=true
fi

FAIL=false

# Collect results in parallel arrays
R_PKG=()
R_SIZE=()
R_LIMIT=()
R_NS_SIZE=()
R_NS_LIMIT=()
R_STATUS=()

for name in "${BUNDLE_KEYS[@]}"; do
  size="$(measure_size "$name")"
  limit_str="$(kv_get cfglimit "$name")"
  limit_bytes="$(parse_kb "$limit_str")"

  ns_size=""
  ns_limit_str="$(kv_get cfgnslimit "$name")"
  ns_limit_bytes=""

  status="pass"

  if (( size > limit_bytes )); then
    status="FAIL"
    FAIL=true
  fi

  if [[ -n "$ns_limit_str" ]]; then
    ns_limit_bytes="$(parse_kb "$ns_limit_str")"
    ns_total="$size"
    deps="$(resolve_ns_deps "$name")"
    for dep in $deps; do
      [[ -z "$dep" ]] && continue
      dep_size="$(measure_size "$dep")"
      ns_total=$(( ns_total + dep_size ))
    done
    ns_size="$ns_total"

    if (( ns_total > ns_limit_bytes )); then
      status="FAIL"
      FAIL=true
    fi
  fi

  R_PKG+=("$name")
  R_SIZE+=("$size")
  R_LIMIT+=("$limit_bytes")
  R_NS_SIZE+=("${ns_size:-}")
  R_NS_LIMIT+=("${ns_limit_bytes:-}")
  R_STATUS+=("$status")
done

# ---------- output ----------

if $JSON_MODE; then
  echo "["
  for i in "${!R_PKG[@]}"; do
    ns_size_json="null"
    ns_limit_json="null"
    if [[ -n "${R_NS_SIZE[$i]}" ]]; then
      ns_size_json="\"$(format_kb "${R_NS_SIZE[$i]}")\""
      ns_limit_json="\"$(format_kb "${R_NS_LIMIT[$i]}")\""
    fi
    comma=","
    if (( i == ${#R_PKG[@]} - 1 )); then comma=""; fi
    cat <<ENTRY
  {"package":"${R_PKG[$i]}","size":"$(format_kb "${R_SIZE[$i]}")","limit":"$(format_kb "${R_LIMIT[$i]}")","nsSize":${ns_size_json},"nsLimit":${ns_limit_json},"status":"${R_STATUS[$i]}"}${comma}
ENTRY
  done
  echo "]"
else
  printf "| %-35s | %8s | %8s | %8s | %8s | %6s |\n" "Package" "Size" "Limit" "NS Size" "NS Limit" "Status"
  printf "| %-35s | %8s | %8s | %8s | %8s | %6s |\n" "-----------------------------------" "--------" "--------" "--------" "--------" "------"
  for i in "${!R_PKG[@]}"; do
    size_fmt="$(format_kb "${R_SIZE[$i]}")"
    limit_fmt="$(format_kb "${R_LIMIT[$i]}")"
    ns_size_fmt="-"
    ns_limit_fmt="-"
    if [[ -n "${R_NS_SIZE[$i]}" ]]; then
      ns_size_fmt="$(format_kb "${R_NS_SIZE[$i]}")"
      ns_limit_fmt="$(format_kb "${R_NS_LIMIT[$i]}")"
    fi
    printf "| %-35s | %8s | %8s | %8s | %8s | %6s |\n" \
      "${R_PKG[$i]}" "$size_fmt" "$limit_fmt" "$ns_size_fmt" "$ns_limit_fmt" "${R_STATUS[$i]}"
  done
fi

if $FAIL; then
  echo ""
  echo "ERROR: One or more bundle size checks failed."
  exit 1
else
  if ! $JSON_MODE; then
    echo ""
    echo "All bundle size checks passed."
  fi
  exit 0
fi
