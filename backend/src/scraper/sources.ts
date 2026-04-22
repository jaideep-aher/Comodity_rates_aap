import type { Category } from '../types.js';

export type MarketSlug = 'apmc_mumbai' | 'apmc_pune' | 'apmc_nashik' | 'apmc_solapur';

export type ScrapeSource = {
  market: MarketSlug;
  url: string;
  category: Category;
  parser: 'apmc_mumbai_table' | 'apmc_generic_table';
};

export const SOURCES: ScrapeSource[] = [
  { market: 'apmc_mumbai', url: 'https://apmcmumbai.org/bajarbhav/daily-bajarbhav-dates/veg',    category: 'veg',    parser: 'apmc_mumbai_table' },
  { market: 'apmc_mumbai', url: 'https://apmcmumbai.org/bajarbhav/daily-bajarbhav-dates/fruit',  category: 'fruit',  parser: 'apmc_mumbai_table' },
  { market: 'apmc_mumbai', url: 'https://apmcmumbai.org/bajarbhav/daily-bajarbhav-dates/dhanya', category: 'grain',  parser: 'apmc_mumbai_table' },
  { market: 'apmc_mumbai', url: 'https://apmcmumbai.org/bajarbhav/daily-bajarbhav-dates/turbhe', category: 'turbhe', parser: 'apmc_mumbai_table' },

  // Pune / Nashik / Solapur scaffolding. URLs are placeholders — replace with
  // the real daily-rates pages when enabling these markets. Parser is a
  // generic "table with आवक / किमान / कमाल / सरासरी columns" variant.
  { market: 'apmc_pune',    url: 'https://puneapmc.org/daily-rates/veg',    category: 'veg',   parser: 'apmc_generic_table' },
  { market: 'apmc_pune',    url: 'https://puneapmc.org/daily-rates/fruit',  category: 'fruit', parser: 'apmc_generic_table' },
  { market: 'apmc_pune',    url: 'https://puneapmc.org/daily-rates/dhanya', category: 'grain', parser: 'apmc_generic_table' },
  { market: 'apmc_nashik',  url: 'https://nashikapmc.org/daily-rates/veg',  category: 'veg',   parser: 'apmc_generic_table' },
  { market: 'apmc_nashik',  url: 'https://nashikapmc.org/daily-rates/fruit',category: 'fruit', parser: 'apmc_generic_table' },
  { market: 'apmc_solapur', url: 'https://solapuragricultureapmc.com/daily/veg',   category: 'veg',   parser: 'apmc_generic_table' },
  { market: 'apmc_solapur', url: 'https://solapuragricultureapmc.com/daily/fruit', category: 'fruit', parser: 'apmc_generic_table' },
];
