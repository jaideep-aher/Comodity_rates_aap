import type { Category } from '../types.js';

export type MarketSlug = 'apmc_mumbai' | 'apmc_pune' | 'apmc_nashik' | 'apmc_solapur';

export type ScrapeSource = {
  market: MarketSlug;
  category: Category;
  parser: 'apmc_mumbai_table' | 'apmc_generic_table';
  /**
   * Listing URL — a page that enumerates recent daily-bajarbhav dates with links
   * like /view-daily-bajarbhav/{cat}/YYYY-MM-DD. The scraper walks this list
   * and fetches the most recent day it hasn't already ingested.
   */
  listingUrl: string;
  /** Slug used in the daily-view URL (e.g. /view-daily-bajarbhav/veg/YYYY-MM-DD). */
  viewSlug: string;
  /** Base origin used to resolve relative links when present. */
  origin: string;
};

export const SOURCES: ScrapeSource[] = [
  {
    market: 'apmc_mumbai',
    category: 'veg',
    parser: 'apmc_mumbai_table',
    listingUrl: 'https://apmcmumbai.org/bajarbhav/daily-bajarbhav-dates/veg',
    viewSlug: 'veg',
    origin: 'https://apmcmumbai.org',
  },
  {
    market: 'apmc_mumbai',
    category: 'fruit',
    parser: 'apmc_mumbai_table',
    listingUrl: 'https://apmcmumbai.org/bajarbhav/daily-bajarbhav-dates/fruit',
    viewSlug: 'fruit',
    origin: 'https://apmcmumbai.org',
  },
  {
    market: 'apmc_mumbai',
    category: 'grain',
    parser: 'apmc_mumbai_table',
    listingUrl: 'https://apmcmumbai.org/bajarbhav/daily-bajarbhav-dates/dhanya',
    viewSlug: 'dhanya',
    origin: 'https://apmcmumbai.org',
  },
  {
    market: 'apmc_mumbai',
    category: 'turbhe',
    parser: 'apmc_mumbai_table',
    listingUrl: 'https://apmcmumbai.org/bajarbhav/daily-bajarbhav-dates/turbhe',
    viewSlug: 'turbhe',
    origin: 'https://apmcmumbai.org',
  },
];
