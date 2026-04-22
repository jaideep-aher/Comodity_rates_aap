import * as cheerio from 'cheerio';

export type ParsedRow = {
  name_mr: string;
  arrival: number;
  min: number;
  max: number;
  avg: number;
};

function toInt(s: string | undefined | null): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/[^0-9-]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function pickTable($: cheerio.CheerioAPI, headerMarker: string): cheerio.Cheerio<any> | null {
  let best: cheerio.Cheerio<any> | null = null;
  $('table').each((_, table) => {
    const headerText = $(table).find('th, thead td, tr:first-child td').text();
    if (headerText.includes(headerMarker)) {
      best = $(table);
      return false; // stop each
    }
    return undefined;
  });
  return best;
}

function extractRows($: cheerio.CheerioAPI, table: cheerio.Cheerio<any>): ParsedRow[] {
  const rows: ParsedRow[] = [];
  table.find('tbody tr, tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 5) return;
    const name = $(tds[0]).text().trim();
    if (!name || /शेतमाल|माल|उत्पादन/.test(name) && name.length < 20) return;
    rows.push({
      name_mr: name,
      arrival: toInt($(tds[1]).text()),
      min: toInt($(tds[2]).text()),
      max: toInt($(tds[3]).text()),
      avg: toInt($(tds[4]).text()),
    });
  });
  return rows;
}

export function parsePriceTable(
  html: string,
  parser: 'apmc_mumbai_table' | 'apmc_generic_table' = 'apmc_mumbai_table',
): ParsedRow[] {
  const $ = cheerio.load(html);
  const table = pickTable($, 'आवक');
  if (!table) return [];
  return extractRows($, table);
}
