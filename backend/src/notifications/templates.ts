type Lang = 'mr' | 'en';

type Row = { name: { mr: string; en: string }; avg: number; deltaPct: number };

export function formatRupees(v: number): string {
  return '₹' + Math.round(v).toLocaleString('en-IN');
}

export function digestTitle(lang: Lang, name: string): string {
  if (lang === 'mr') return `सुप्रभात${name ? ' ' + name : ''}!`;
  return `Good morning${name ? ' ' + name : ''}!`;
}

export function digestBody(lang: Lang, rows: Row[]): string {
  if (rows.length === 0) {
    return lang === 'mr'
      ? 'आज तुमच्या पिकांचे नवीन भाव उपलब्ध नाहीत.'
      : "No new prices for your crops today.";
  }
  const lines = rows.slice(0, 5).map((r) => {
    const arrow = r.deltaPct > 0.1 ? '▲' : r.deltaPct < -0.1 ? '▼' : '–';
    const pct = Math.abs(r.deltaPct).toFixed(1);
    return `${r.name[lang]} ${formatRupees(r.avg)} ${arrow}${pct}%`;
  });
  return lines.join(' · ');
}

export function thresholdTitle(lang: Lang, name: string): string {
  return lang === 'mr' ? `${name} चा भाव बदलला!` : `${name} price alert`;
}

export function thresholdBody(
  lang: Lang,
  name: string,
  avg: number,
  kind: 'above' | 'below',
  threshold: number,
): string {
  if (lang === 'mr') {
    const suffix =
      kind === 'above' ? `${formatRupees(threshold)} च्या वर` : `${formatRupees(threshold)} च्या खाली`;
    return `${name} आज ${formatRupees(avg)} वर आला आहे (${suffix}).`;
  }
  const suffix = kind === 'above' ? `above ${formatRupees(threshold)}` : `below ${formatRupees(threshold)}`;
  return `${name} is now ${formatRupees(avg)} (${suffix}).`;
}

export function spikeTitle(lang: Lang, name: string, deltaPct: number): string {
  const pct = Math.abs(deltaPct).toFixed(0);
  if (lang === 'mr') {
    return deltaPct > 0 ? `${name} आज ${pct}% वाढला` : `${name} आज ${pct}% घटला`;
  }
  return deltaPct > 0 ? `${name} up ${pct}% today` : `${name} down ${pct}% today`;
}

export function spikeBody(lang: Lang, name: string, avg: number): string {
  if (lang === 'mr') return `आजचा सरासरी भाव ${formatRupees(avg)} प्रति क्विंटल आहे.`;
  return `Today's average price is ${formatRupees(avg)} per quintal.`;
}
