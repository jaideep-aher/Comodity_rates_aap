import type {
  BuyerProfile,
  Listing,
  QualityGrade,
  TransportOffer,
  TransportRequest,
} from '../types';
import { IS_REAL } from './config';
import { http } from './http';

export type BrowseListingsParams = {
  commodityId?: number;
  category?: 'veg' | 'fruit' | 'grain' | 'turbhe';
  district?: string;
  maxPrice?: number;
  limit?: number;
};

export type CreateListingInput = {
  commodityId: number;
  quantityQtl: number;
  qualityGrade: QualityGrade;
  askPrice: number;
  isNegotiable: boolean;
  village: string;
  taluka?: string;
  district?: string;
  state?: string;
  readyFrom?: string;
  readyUntil?: string;
  notes?: string;
  photos?: string[];
};

export type Inquiry = {
  id: string;
  listing_id: string;
  message: string;
  offer_price: number | null;
  status: 'sent' | 'seen' | 'accepted' | 'declined' | 'withdrawn';
  created_at: string;
  name_mr?: string;
  name_en?: string;
  commodity_slug?: string;
  ask_price?: number;
  buyer_name?: string | null;
  buyer_phone?: string;
};

const MOCK_LISTINGS: Listing[] = [];
const MOCK_BUYERS: BuyerProfile[] = [];
const MOCK_OFFERS: TransportOffer[] = [];
const MOCK_REQUESTS: TransportRequest[] = [];

export async function browseListings(params: BrowseListingsParams = {}): Promise<Listing[]> {
  if (!IS_REAL) return MOCK_LISTINGS;
  return http<Listing[]>('/api/listings', {
    auth: false,
    query: {
      commodityId: params.commodityId,
      category: params.category,
      district: params.district,
      maxPrice: params.maxPrice,
      limit: params.limit ?? 40,
    },
  });
}

export async function getListing(id: string): Promise<Listing | null> {
  if (!IS_REAL) return MOCK_LISTINGS.find((l) => l.id === id) ?? null;
  try {
    return await http<Listing>(`/api/listings/${id}`, { auth: false });
  } catch {
    return null;
  }
}

export async function getMyListings(): Promise<Listing[]> {
  if (!IS_REAL) return MOCK_LISTINGS;
  return http<Listing[]>('/api/me/listings');
}

export async function createListing(input: CreateListingInput): Promise<{ id: string }> {
  if (!IS_REAL) {
    const id = 'mock-' + Date.now();
    return { id };
  }
  return http<{ id: string }>('/api/me/listings', { method: 'POST', body: input });
}

export async function updateListing(
  id: string,
  patch: Partial<Pick<Listing, 'askPrice' | 'isNegotiable' | 'notes' | 'photos' | 'status'>>,
): Promise<void> {
  if (!IS_REAL) return;
  await http(`/api/me/listings/${id}`, { method: 'PATCH', body: patch });
}

export async function deleteListing(id: string): Promise<void> {
  if (!IS_REAL) return;
  await http(`/api/me/listings/${id}`, { method: 'DELETE' });
}

export async function sendInquiry(
  listingId: string,
  message: string,
  offerPrice?: number,
): Promise<{ id: string }> {
  if (!IS_REAL) return { id: 'mock-inq' };
  return http<{ id: string }>(`/api/listings/${listingId}/inquiries`, {
    method: 'POST',
    body: { message, offerPrice },
  });
}

export async function getInquiriesSent(): Promise<Inquiry[]> {
  if (!IS_REAL) return [];
  return http<Inquiry[]>('/api/me/inquiries/sent');
}

export async function getInquiriesReceived(): Promise<Inquiry[]> {
  if (!IS_REAL) return [];
  return http<Inquiry[]>('/api/me/inquiries/received');
}

// ─── Buyers ──

export async function browseBuyers(params: { city?: string; category?: string; verifiedOnly?: boolean } = {}): Promise<BuyerProfile[]> {
  if (!IS_REAL) return MOCK_BUYERS;
  return http<BuyerProfile[]>('/api/buyers', {
    auth: false,
    query: {
      city: params.city,
      category: params.category,
      verifiedOnly: params.verifiedOnly ? 'true' : undefined,
    },
  });
}

export async function getMyBuyerProfile(): Promise<BuyerProfile | null> {
  if (!IS_REAL) return null;
  try {
    return await http<BuyerProfile>('/api/me/buyer-profile');
  } catch {
    return null;
  }
}

export type BuyerUpsert = {
  businessName: string;
  contactName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  gstin?: string;
  city: string;
  state?: string;
  buysCategories?: ('veg' | 'fruit' | 'grain' | 'turbhe')[];
  monthlyVolumeQtl?: number;
  aboutMr?: string;
  aboutEn?: string;
};

export async function upsertBuyerProfile(input: BuyerUpsert): Promise<{ id: string; updated: boolean }> {
  if (!IS_REAL) return { id: 'mock', updated: false };
  return http('/api/me/buyer-profile', { method: 'PUT', body: input });
}

// ─── Transport ──

export async function browseTransportOffers(params: { fromCity?: string; toCity?: string } = {}): Promise<TransportOffer[]> {
  if (!IS_REAL) return MOCK_OFFERS;
  return http<TransportOffer[]>('/api/transport/offers', {
    auth: false,
    query: { fromCity: params.fromCity, toCity: params.toCity },
  });
}

export async function browseTransportRequests(params: { fromCity?: string; toCity?: string } = {}): Promise<TransportRequest[]> {
  if (!IS_REAL) return MOCK_REQUESTS;
  return http<TransportRequest[]>('/api/transport/requests', {
    auth: false,
    query: { fromCity: params.fromCity, toCity: params.toCity },
  });
}

export type CreateTransportRequestInput = {
  fromCity: string;
  toCity: string;
  commodityId?: number;
  quantityQtl: number;
  neededBy: string;
  maxBudget?: number;
  notes?: string;
};

export async function createTransportRequest(
  input: CreateTransportRequestInput,
): Promise<{ id: string }> {
  if (!IS_REAL) return { id: 'mock' };
  return http('/api/me/transport-requests', { method: 'POST', body: input });
}

export type CreateTransportOfferInput = {
  truckType: string;
  capacityQtl: number;
  fromCity: string;
  toCity: string;
  availableFrom: string;
  availableUntil?: string;
  priceQuote?: number;
  priceUnit?: 'trip' | 'per_qtl' | 'per_km';
  notes?: string;
};

export async function createTransportOffer(
  input: CreateTransportOfferInput,
): Promise<{ id: string }> {
  if (!IS_REAL) return { id: 'mock' };
  return http('/api/me/transport-offers', { method: 'POST', body: input });
}

export type TransportOperatorUpsert = {
  name: string;
  phone: string;
  whatsapp?: string;
  baseCity: string;
  truckTypes?: string[];
};

export async function upsertTransportProfile(
  input: TransportOperatorUpsert,
): Promise<{ id: string; updated: boolean }> {
  if (!IS_REAL) return { id: 'mock', updated: false };
  return http('/api/me/transport-profile', { method: 'PUT', body: input });
}
