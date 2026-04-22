import type { Language } from '../types';

export type Scheme = {
  id: string;
  iconKey: 'rupee' | 'seed' | 'drop' | 'shield' | 'home' | 'truck';
  color: string;
  title: { mr: string; en: string };
  short: { mr: string; en: string };
  benefit: { mr: string; en: string };
  eligibility: { mr: string; en: string };
  howTo: { mr: string; en: string };
  url: string;
};

// Curated list of central + Maharashtra-state schemes farmers actually ask about.
export const SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan',
    iconKey: 'rupee',
    color: '#0B6E4F',
    title: {
      mr: 'पीएम-किसान सन्मान निधी',
      en: 'PM-Kisan Samman Nidhi',
    },
    short: {
      mr: 'वर्षाला ₹६,००० — तीन हप्त्यांत',
      en: '₹6,000 / year in three instalments',
    },
    benefit: {
      mr: 'प्रत्येक पात्र शेतकरी कुटुंबास प्रती हप्ता ₹२,००० थेट बँक खात्यात. वर्षाला ₹६,०००.',
      en: 'Eligible farmer families receive ₹2,000 per instalment, three times a year — ₹6,000 total.',
    },
    eligibility: {
      mr: 'लहान व सीमांत शेतकरी. जमिनीचे सात-बारा उतारा व आधार कार्ड आवश्यक.',
      en: 'Small and marginal landholding farmers with a 7/12 record and Aadhaar card.',
    },
    howTo: {
      mr: 'pmkisan.gov.in वर नोंदणी करा किंवा CSC केंद्रात जा. eKYC पूर्ण करणे अनिवार्य.',
      en: 'Register at pmkisan.gov.in or at a CSC centre. Completing eKYC is mandatory.',
    },
    url: 'https://pmkisan.gov.in',
  },
  {
    id: 'pmfby',
    iconKey: 'shield',
    color: '#0EA5E9',
    title: {
      mr: 'प्रधानमंत्री पीक विमा योजना (PMFBY)',
      en: 'Pradhan Mantri Fasal Bima Yojana',
    },
    short: {
      mr: 'अत्यल्प हप्त्यात पिकाचा विमा',
      en: 'Crop insurance at a tiny premium',
    },
    benefit: {
      mr: 'नैसर्गिक आपत्ती, कीड, रोगामुळे झालेल्या नुकसान भरपाईसाठी विमा.',
      en: 'Cover for losses from natural calamities, pests, and disease.',
    },
    eligibility: {
      mr: 'सर्व शेतकरी — कर्जदार व बिगर-कर्जदार दोघेही.',
      en: 'All farmers — both loanee and non-loanee.',
    },
    howTo: {
      mr: 'जवळच्या बँकेत किंवा pmfby.gov.in वरून अर्ज करा. पेरणीनंतर ५ दिवसांच्या आत.',
      en: 'Apply at your nearest bank or at pmfby.gov.in within 5 days of sowing.',
    },
    url: 'https://pmfby.gov.in',
  },
  {
    id: 'kcc',
    iconKey: 'rupee',
    color: '#E86A1D',
    title: {
      mr: 'किसान क्रेडिट कार्ड (KCC)',
      en: 'Kisan Credit Card',
    },
    short: {
      mr: '४% व्याजाने शेती कर्ज',
      en: 'Farm loans at 4% interest',
    },
    benefit: {
      mr: 'पेरणी, खते व इतर शेती खर्चासाठी कमी व्याजाने कर्ज. ₹३ लाखांपर्यंत.',
      en: 'Low-interest credit for sowing, fertilisers, and other farm expenses — up to ₹3 lakh.',
    },
    eligibility: {
      mr: 'जमिनीचा मालक किंवा भाडेकरू शेतकरी.',
      en: 'Farmer who owns or leases land.',
    },
    howTo: {
      mr: 'कोणत्याही राष्ट्रीयीकृत बँकेत पासबुक व आधार घेऊन अर्ज करा.',
      en: 'Apply at any nationalised bank with passbook and Aadhaar.',
    },
    url: 'https://www.india.gov.in/spotlight/kisan-credit-card-scheme',
  },
  {
    id: 'pmksy',
    iconKey: 'drop',
    color: '#0EA5E9',
    title: {
      mr: 'पीएम कृषी सिंचन योजना',
      en: 'PM Krishi Sinchai Yojana',
    },
    short: {
      mr: 'ठिबक / तुषार संचावर अनुदान',
      en: 'Subsidy on drip / sprinkler kits',
    },
    benefit: {
      mr: 'लहान शेतकऱ्यांना ५५% व इतर शेतकऱ्यांना ४५% अनुदान.',
      en: 'Up to 55% subsidy for small farmers, 45% for others.',
    },
    eligibility: {
      mr: 'महाराष्ट्रातील सर्व शेतकरी. सात-बारा व स्वतःचा बँक खाते आवश्यक.',
      en: 'All farmers in Maharashtra with land records and an active bank account.',
    },
    howTo: {
      mr: 'mahadbtmahait.gov.in वर अर्ज करा किंवा कृषी सहाय्यकांना भेटा.',
      en: 'Apply on mahadbtmahait.gov.in or visit your local Krishi Sahayak.',
    },
    url: 'https://mahadbtmahait.gov.in',
  },
  {
    id: 'nmssa',
    iconKey: 'seed',
    color: '#15803D',
    title: {
      mr: 'राष्ट्रीय शाश्वत कृषी अभियान',
      en: 'National Mission on Sustainable Agriculture',
    },
    short: {
      mr: 'सेंद्रिय शेतीला प्रोत्साहन',
      en: 'Support for organic farming',
    },
    benefit: {
      mr: 'सेंद्रिय प्रमाणपत्र, बियाणे व अनुदान.',
      en: 'Organic certification, seeds, and input subsidies.',
    },
    eligibility: {
      mr: 'गट शेती करणारे शेतकरी (किमान २० शेतकरी / गट).',
      en: 'Farmers in groups (minimum 20 per group).',
    },
    howTo: {
      mr: 'तालुका कृषी अधिकारी कार्यालयात नोंदणी करा.',
      en: 'Register at the Taluka Agriculture Officer.',
    },
    url: 'https://nmsa.dac.gov.in',
  },
  {
    id: 'e-nam',
    iconKey: 'truck',
    color: '#BE185D',
    title: {
      mr: 'e-NAM ऑनलाइन बाजार',
      en: 'e-NAM online market',
    },
    short: {
      mr: 'देशभरातील बाजारात विक्री',
      en: 'Sell across pan-India mandis',
    },
    benefit: {
      mr: 'APMC च्या बाहेरील खरेदीदारांपर्यंत पोहोच. पारदर्शक भाव.',
      en: 'Reach buyers beyond your local APMC. Transparent pricing.',
    },
    eligibility: {
      mr: 'नोंदणीकृत APMC चा सदस्य शेतकरी.',
      en: 'Farmers registered with a participating APMC.',
    },
    howTo: {
      mr: 'आपल्या APMC मध्ये नोंदणी करा आणि enam.gov.in वर लॉगिन करा.',
      en: 'Register at your APMC and sign in at enam.gov.in.',
    },
    url: 'https://enam.gov.in',
  },
];

export function schemeTitle(s: Scheme, lang: Language): string {
  return s.title[lang];
}
