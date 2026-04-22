import type { Language } from '../types';

const DEVA_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toDevanagariDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => DEVA_DIGITS[Number(d)]);
}

export function localiseNumber(value: number | string, lang: Language): string {
  const base = typeof value === 'number'
    ? value.toLocaleString('en-IN')
    : String(value);
  return lang === 'mr' ? toDevanagariDigits(base) : base;
}

export function formatRupees(value: number, lang: Language = 'en'): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value).toLocaleString('en-IN');
  return '₹' + (lang === 'mr' ? toDevanagariDigits(rounded) : rounded);
}

export function formatRupeesPerQtl(value: number, lang: Language): string {
  const suffix = lang === 'mr' ? '/क्विं' : '/qtl';
  return formatRupees(value, lang) + suffix;
}

export function formatRupeesPerKg(value: number, lang: Language): string {
  const suffix = lang === 'mr' ? '/किलो' : '/kg';
  const kg = (value / 100).toFixed(2);
  return '₹' + (lang === 'mr' ? toDevanagariDigits(kg) : kg) + suffix;
}

export function formatArrival(qtl: number, lang: Language): string {
  const suffix = lang === 'mr' ? ' क्विं' : ' qtl';
  const base = qtl.toLocaleString('en-IN');
  return (lang === 'mr' ? toDevanagariDigits(base) : base) + suffix;
}

export function formatDelta(pct: number, lang: Language = 'en'): string {
  const sign = pct > 0 ? '+' : '';
  const body = sign + pct.toFixed(1) + '%';
  return lang === 'mr' ? toDevanagariDigits(body) : body;
}

export function formatDate(iso: string, lang: Language): string {
  const d = new Date(iso);
  if (lang === 'mr') {
    const months = [
      'जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून',
      'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें',
    ];
    return `${toDevanagariDigits(d.getDate())} ${months[d.getMonth()]}, ${toDevanagariDigits(d.getFullYear())}`;
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatWeekday(iso: string, lang: Language): string {
  const d = new Date(iso);
  if (lang === 'mr') {
    const days = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरूवार', 'शुक्रवार', 'शनिवार'];
    return days[d.getDay()];
  }
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function formatRelative(iso: string, lang: Language): string {
  const then = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 60) return lang === 'mr' ? 'आत्ता' : 'just now';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === 'mr' ? `${toDevanagariDigits(m)} मिनिटांपूर्वी` : `${m} min ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return lang === 'mr' ? `${toDevanagariDigits(h)} तासांपूर्वी` : `${h} h ago`;
  }
  const d = Math.floor(diff / 86400);
  return lang === 'mr' ? `${toDevanagariDigits(d)} दिवसांपूर्वी` : `${d} d ago`;
}
