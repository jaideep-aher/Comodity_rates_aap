export type Category = 'veg' | 'fruit' | 'grain' | 'turbhe';

export type CommodityRow = {
  id: number;
  slug: string;
  name_mr: string;
  name_en: string;
  category: Category;
  icon_key: string;
  unit: string;
};

export type PriceSnapshotRow = {
  commodity_id: number;
  date: string;
  arrival_qtl: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  scraped_at: string;
};

export type PriceResponse = {
  date: string;
  stale: boolean;
  source: string;
  items: {
    id: number;
    slug: string;
    name: { mr: string; en: string };
    category: Category;
    iconKey: string;
    today: {
      date: string;
      arrival: number;
      min: number;
      max: number;
      avg: number;
    };
    deltaPct: number;
    spark: number[];
  }[];
};

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    rawBody?: string;
  }
}
