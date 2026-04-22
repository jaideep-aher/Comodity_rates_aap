// Earthy, optimistic palette. Warm terracotta accents on a sage-green base —
// legible outdoors in bright sun, printable at low contrast, and avoids the
// generic "agri app blue/green" look competitors default to.
export const colors = {
  primary: '#0B6E4F',
  primaryDark: '#08543C',
  primaryLight: '#E6F4EE',
  primarySoft: '#D1EADF',
  accent: '#F5A524',
  accentSoft: '#FEF3C7',
  saffron: '#E86A1D',
  saffronSoft: '#FDE7D6',
  indigo: '#3949AB',
  indigoSoft: '#E1E4F5',
  sky: '#0EA5E9',
  skySoft: '#E0F2FE',
  berry: '#BE185D',
  berrySoft: '#FCE7F3',

  bg: '#F7F8F5',
  bgAlt: '#EEF2EC',
  surface: '#FFFFFF',
  surfaceAlt: '#FBFBF7',
  border: '#E5E7EB',
  borderStrong: '#CBD5E1',

  text: '#0F172A',
  textMuted: '#475569',
  textSubtle: '#94A3B8',

  up: '#15803D',
  upBg: '#DCFCE7',
  down: '#B91C1C',
  downBg: '#FEE2E2',
  flat: '#64748B',
  flatBg: '#E2E8F0',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',

  gradientHeroStart: '#0B6E4F',
  gradientHeroEnd: '#138D66',
  gradientPremiumStart: '#E86A1D',
  gradientPremiumEnd: '#F5A524',
  gradientSkyStart: '#0EA5E9',
  gradientSkyEnd: '#60A5FA',
};

export const categoryPalette = {
  veg: { fg: '#15803D', bg: '#DCFCE7', ring: '#86EFAC' },
  fruit: { fg: '#BE185D', bg: '#FCE7F3', ring: '#F9A8D4' },
  grain: { fg: '#A16207', bg: '#FEF3C7', ring: '#FDE68A' },
  turbhe: { fg: '#0E7490', bg: '#CFFAFE', ring: '#67E8F9' },
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  pill: 999,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const font = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 34,
  hero: 44,
};

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  soft: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pop: {
    shadowColor: '#0B6E4F',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};
