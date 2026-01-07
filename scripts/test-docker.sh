#!/bin/bash

# Multi-runtime Docker test runner
# Usage: ./scripts/test-docker.sh [runtime]
# Examples:
#   ./scripts/test-docker.sh bun-1
#   ./scripts/test-docker.sh node-20
#   ./scripts/test-docker.sh all

set -e

RUNTIME="${1:-all}"

AVAILABLE_RUNTIMES=("bun-1" "deno-1" "deno-2" "node-20" "node-22" "node-24")

run_test() {
  local runtime=$1
  echo "========================================="
  echo "Running tests for: $runtime"
  echo "========================================="
  docker compose -f docker/docker-compose.yml build "$runtime"
  docker compose -f docker/docker-compose.yml run --rm "$runtime"
}

if [ "$RUNTIME" = "all" ]; then
  echo "Running tests for all runtimes..."
  for runtime in "${AVAILABLE_RUNTIMES[@]}"; do
    run_test "$runtime"
  done
elif [[ " ${AVAILABLE_RUNTIMES[@]} " =~ " ${RUNTIME} " ]]; then
  run_test "$RUNTIME"
else
  echo "Error: Unknown runtime '$RUNTIME'"
  echo "Available runtimes: ${AVAILABLE_RUNTIMES[*]} all"
  exit 1
fi

echo ""
echo "========================================="
echo "All tests completed successfully!"
echo "========================================="
