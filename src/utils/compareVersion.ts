/**
 * Compare dotted numeric versions (major.minor.patch). Non-numeric tails are ignored.
 * Returns true if `a` is strictly older than `b`.
 */
export function isVersionOlderThan(a: string, b: string): boolean {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return true;
    if (pa[i] > pb[i]) return false;
  }
  return false;
}

/** True if `a` is strictly newer than `b` (dotted semver-style). */
export function isVersionNewerThan(a: string, b: string): boolean {
  return isVersionOlderThan(b, a);
}

function parseVersion(v: string): [number, number, number] {
  const m = v.trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return [0, 0, 0];
  return [
    Number(m[1]) || 0,
    m[2] !== undefined ? Number(m[2]) || 0 : 0,
    m[3] !== undefined ? Number(m[3]) || 0 : 0,
  ];
}
