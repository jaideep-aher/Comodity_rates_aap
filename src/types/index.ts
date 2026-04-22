export type Category = 'veg' | 'fruit' | 'grain' | 'turbhe';

export type LocalizedName = {
  mr: string;
  en: string;
};

export type Commodity = {
  id: number;
  slug: string;
  name: LocalizedName;
  category: Category;
  iconKey: string;
  unit: 'quintal';
};

export type PriceSnapshot = {
  date: string;
  arrival: number;
  min: number;
  max: number;
  avg: number;
};

export type CommodityWithPrice = Commodity & {
  today: PriceSnapshot;
  yesterday?: PriceSnapshot;
  deltaPct: number;
  spark: number[];
};

export type CommodityDetail = CommodityWithPrice & {
  history30d: PriceSnapshot[];
};

export type Alert = {
  commodityId: number;
  min: number | null;
  max: number | null;
};

export type Language = 'mr' | 'en';

// ─── Stage 3 ──

export type Market = {
  slug: string;
  name: LocalizedName;
  state: string;
  city: string;
  isPremium: boolean;
};

export type QualityGrade = 'premium' | 'standard' | 'value';

export type ListingStatus = 'open' | 'reserved' | 'sold' | 'expired' | 'hidden';

export type Listing = {
  id: string;
  commodity: {
    id: number;
    slug: string;
    name: LocalizedName;
    iconKey: string;
  };
  quantityQtl: number;
  qualityGrade: QualityGrade;
  askPrice: number;
  isNegotiable: boolean;
  location: {
    village: string;
    taluka: string | null;
    district: string | null;
    state: string;
  };
  readyFrom: string;
  readyUntil: string | null;
  notes: string | null;
  photos: string[];
  status: ListingStatus;
  viewCount: number;
  seller: {
    id: string;
    name: string | null;
    phone: string;
  };
  createdAt: string;
};

export type BuyerProfile = {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  city: string;
  state: string;
  buys_categories: Category[];
  monthly_volume_qtl: number | null;
  is_verified: boolean;
  is_paid: boolean;
  about_mr: string | null;
  about_en: string | null;
};

export type TransportOffer = {
  id: string;
  truck_type: string;
  capacity_qtl: number;
  from_city: string;
  to_city: string;
  available_from: string;
  available_until: string | null;
  price_quote: number | null;
  price_unit: 'trip' | 'per_qtl' | 'per_km';
  notes: string | null;
  operator_name: string;
  operator_phone: string;
  operator_whatsapp: string | null;
  is_verified: boolean;
  rating_avg: number | null;
  ratings_count: number;
};

export type TransportRequest = {
  id: string;
  from_city: string;
  to_city: string;
  commodity_id: number | null;
  quantity_qtl: number;
  needed_by: string;
  max_budget: number | null;
  notes: string | null;
  requester_name: string | null;
  requester_phone: string;
  created_at: string;
};

export type SubscriptionStatus = {
  active: boolean;
  plan: 'monthly' | 'yearly' | null;
  status: 'none' | 'pending' | 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: string | null;
};

export type PremiumPlan = {
  id: 'monthly' | 'yearly';
  amountPaise: number;
  interval: 'month' | 'year';
  durationDays: number;
};
