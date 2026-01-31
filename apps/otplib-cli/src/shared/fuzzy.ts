/**
 * Fuzzy match: checks if all characters of query appear in target in order.
 * e.g. "ghub" matches "GitHub", "gml" matches "gmail.com"
 */
export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}
