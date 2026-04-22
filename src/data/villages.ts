import type { LocalizedName } from '../types';

// Curated Maharashtra locations. Lat/lng let us call hyper-local weather APIs
// (Open-Meteo) even when the farmer hasn't granted GPS. A bigger list should
// come from a backend table — this is a pragmatic seed covering the major
// APMC catchments.
export type Village = {
  id: string;
  name: LocalizedName;
  taluka: string;
  district: LocalizedName;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
};

export const VILLAGES: Village[] = [
  { id: 'mumbai', name: { mr: 'मुंबई', en: 'Mumbai' }, taluka: 'Mumbai', district: { mr: 'मुंबई', en: 'Mumbai' }, state: 'MH', pincode: '400001', lat: 19.076, lng: 72.8777 },
  { id: 'turbhe', name: { mr: 'तुर्भे (नवी मुंबई)', en: 'Turbhe (Navi Mumbai)' }, taluka: 'Navi Mumbai', district: { mr: 'ठाणे', en: 'Thane' }, state: 'MH', pincode: '400705', lat: 19.078, lng: 73.0168 },
  { id: 'pune', name: { mr: 'पुणे', en: 'Pune' }, taluka: 'Pune', district: { mr: 'पुणे', en: 'Pune' }, state: 'MH', pincode: '411001', lat: 18.5204, lng: 73.8567 },
  { id: 'junnar', name: { mr: 'जुन्नर', en: 'Junnar' }, taluka: 'Junnar', district: { mr: 'पुणे', en: 'Pune' }, state: 'MH', pincode: '410502', lat: 19.2092, lng: 73.8773 },
  { id: 'manchar', name: { mr: 'मंचर', en: 'Manchar' }, taluka: 'Ambegaon', district: { mr: 'पुणे', en: 'Pune' }, state: 'MH', pincode: '410503', lat: 19.0115, lng: 73.9372 },
  { id: 'narayangaon', name: { mr: 'नारायणगाव', en: 'Narayangaon' }, taluka: 'Junnar', district: { mr: 'पुणे', en: 'Pune' }, state: 'MH', pincode: '410504', lat: 19.115, lng: 73.953 },
  { id: 'nashik', name: { mr: 'नाशिक', en: 'Nashik' }, taluka: 'Nashik', district: { mr: 'नाशिक', en: 'Nashik' }, state: 'MH', pincode: '422001', lat: 19.9975, lng: 73.7898 },
  { id: 'lasalgaon', name: { mr: 'लासलगाव', en: 'Lasalgaon' }, taluka: 'Niphad', district: { mr: 'नाशिक', en: 'Nashik' }, state: 'MH', pincode: '422306', lat: 20.1494, lng: 74.2385 },
  { id: 'pimpalgaon', name: { mr: 'पिंपळगाव बसवंत', en: 'Pimpalgaon Baswant' }, taluka: 'Niphad', district: { mr: 'नाशिक', en: 'Nashik' }, state: 'MH', pincode: '422209', lat: 20.168, lng: 73.977 },
  { id: 'solapur', name: { mr: 'सोलापूर', en: 'Solapur' }, taluka: 'Solapur North', district: { mr: 'सोलापूर', en: 'Solapur' }, state: 'MH', pincode: '413001', lat: 17.6599, lng: 75.9064 },
  { id: 'barshi', name: { mr: 'बार्शी', en: 'Barshi' }, taluka: 'Barshi', district: { mr: 'सोलापूर', en: 'Solapur' }, state: 'MH', pincode: '413401', lat: 18.2308, lng: 75.6917 },
  { id: 'aurangabad', name: { mr: 'छत्रपती संभाजीनगर (औरंगाबाद)', en: 'Chh. Sambhajinagar (Aurangabad)' }, taluka: 'Aurangabad', district: { mr: 'छ. संभाजीनगर', en: 'Ch. Sambhajinagar' }, state: 'MH', pincode: '431001', lat: 19.8762, lng: 75.3433 },
  { id: 'ahmednagar', name: { mr: 'अहिल्यानगर', en: 'Ahilyanagar (Ahmednagar)' }, taluka: 'Ahmednagar', district: { mr: 'अहिल्यानगर', en: 'Ahilyanagar' }, state: 'MH', pincode: '414001', lat: 19.0948, lng: 74.748 },
  { id: 'kolhapur', name: { mr: 'कोल्हापूर', en: 'Kolhapur' }, taluka: 'Kolhapur', district: { mr: 'कोल्हापूर', en: 'Kolhapur' }, state: 'MH', pincode: '416001', lat: 16.705, lng: 74.2433 },
  { id: 'sangli', name: { mr: 'सांगली', en: 'Sangli' }, taluka: 'Miraj', district: { mr: 'सांगली', en: 'Sangli' }, state: 'MH', pincode: '416416', lat: 16.8524, lng: 74.5815 },
  { id: 'satara', name: { mr: 'सातारा', en: 'Satara' }, taluka: 'Satara', district: { mr: 'सातारा', en: 'Satara' }, state: 'MH', pincode: '415001', lat: 17.6805, lng: 74.0183 },
  { id: 'nagpur', name: { mr: 'नागपूर', en: 'Nagpur' }, taluka: 'Nagpur', district: { mr: 'नागपूर', en: 'Nagpur' }, state: 'MH', pincode: '440001', lat: 21.1458, lng: 79.0882 },
  { id: 'amravati', name: { mr: 'अमरावती', en: 'Amravati' }, taluka: 'Amravati', district: { mr: 'अमरावती', en: 'Amravati' }, state: 'MH', pincode: '444601', lat: 20.9374, lng: 77.7796 },
  { id: 'akola', name: { mr: 'अकोला', en: 'Akola' }, taluka: 'Akola', district: { mr: 'अकोला', en: 'Akola' }, state: 'MH', pincode: '444001', lat: 20.7002, lng: 77.0082 },
  { id: 'yavatmal', name: { mr: 'यवतमाळ', en: 'Yavatmal' }, taluka: 'Yavatmal', district: { mr: 'यवतमाळ', en: 'Yavatmal' }, state: 'MH', pincode: '445001', lat: 20.3899, lng: 78.1307 },
  { id: 'jalgaon', name: { mr: 'जळगाव', en: 'Jalgaon' }, taluka: 'Jalgaon', district: { mr: 'जळगाव', en: 'Jalgaon' }, state: 'MH', pincode: '425001', lat: 21.0077, lng: 75.5626 },
  { id: 'dhule', name: { mr: 'धुळे', en: 'Dhule' }, taluka: 'Dhule', district: { mr: 'धुळे', en: 'Dhule' }, state: 'MH', pincode: '424001', lat: 20.9042, lng: 74.7749 },
  { id: 'beed', name: { mr: 'बीड', en: 'Beed' }, taluka: 'Beed', district: { mr: 'बीड', en: 'Beed' }, state: 'MH', pincode: '431122', lat: 18.9891, lng: 75.7601 },
  { id: 'latur', name: { mr: 'लातूर', en: 'Latur' }, taluka: 'Latur', district: { mr: 'लातूर', en: 'Latur' }, state: 'MH', pincode: '413512', lat: 18.4088, lng: 76.5604 },
  { id: 'nanded', name: { mr: 'नांदेड', en: 'Nanded' }, taluka: 'Nanded', district: { mr: 'नांदेड', en: 'Nanded' }, state: 'MH', pincode: '431601', lat: 19.1383, lng: 77.321 },
];

export function findVillage(id: string | null | undefined): Village | null {
  if (!id) return null;
  return VILLAGES.find((v) => v.id === id) ?? null;
}

// Coarse pincode lookup — matches on first 3 digits (postal zone) which is
// enough to land within ~50 km of the farmer's block.
export function findVillageByPincode(pincode: string): Village | null {
  const prefix = pincode.slice(0, 3);
  return (
    VILLAGES.find((v) => v.pincode === pincode) ??
    VILLAGES.find((v) => v.pincode.startsWith(prefix)) ??
    null
  );
}

// Haversine distance in km — for picking the nearest village from GPS coords.
export function nearestVillage(lat: number, lng: number): Village {
  let best = VILLAGES[0];
  let bestD = Infinity;
  for (const v of VILLAGES) {
    const d = haversine(lat, lng, v.lat, v.lng);
    if (d < bestD) {
      bestD = d;
      best = v;
    }
  }
  return best;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
