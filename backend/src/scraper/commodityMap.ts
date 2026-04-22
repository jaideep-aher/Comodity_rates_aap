import { query } from '../db.js';

let cache: Map<string, { id: number; slug: string }> | null = null;

function normalize(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .toLowerCase();
}

export async function loadCommodityMap(): Promise<Map<string, { id: number; slug: string }>> {
  if (cache) return cache;
  const res = await query<{ id: number; slug: string; name_mr: string; name_en: string }>(
    'SELECT id, slug, name_mr, name_en FROM commodities',
  );
  const map = new Map<string, { id: number; slug: string }>();
  for (const r of res.rows) {
    map.set(normalize(r.name_mr), { id: r.id, slug: r.slug });
    map.set(normalize(r.name_en), { id: r.id, slug: r.slug });
  }
  cache = map;
  return map;
}

export function invalidateCommodityMap() {
  cache = null;
}

export async function findCommodity(
  nameMr: string,
  category: string,
): Promise<{ id: number; slug: string } | null> {
  const map = await loadCommodityMap();
  const hit = map.get(normalize(nameMr));
  if (hit) return hit;

  // Last-resort fuzzy match: find a row whose normalized name is contained in nameMr or vice versa.
  const n = normalize(nameMr);
  for (const [key, val] of map.entries()) {
    if (key.length < 3) continue;
    if (n.includes(key) || key.includes(n)) return val;
  }

  // Record unknowns so we can add them later with needs_review=true.
  await query(
    `INSERT INTO commodities (slug, name_mr, name_en, category, needs_review)
     VALUES ($1, $2, $2, $3, TRUE)
     ON CONFLICT (slug) DO NOTHING`,
    [slugify(nameMr) + '-' + Date.now().toString(36), nameMr, category],
  );
  invalidateCommodityMap();
  const map2 = await loadCommodityMap();
  return map2.get(normalize(nameMr)) ?? null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'unknown';
}
