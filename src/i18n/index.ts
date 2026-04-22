import type { Language } from '../types';

type Dict = {
  appName: string;
  tagline: string;

  langMr: string;
  langEn: string;
  continue: string;
  skip: string;
  back: string;
  save: string;
  cancel: string;
  remove: string;
  add: string;
  done: string;
  search: string;
  loading: string;
  refresh: string;
  tryAgain: string;
  comingSoon: string;
  shareWithFriends: string;
  viewAll: string;
  open: string;

  onboardingLangTitle: string;
  onboardingLangSubtitle: string;

  onboardingCropsTitle: string;
  onboardingCropsSubtitle: string;
  onboardingCropsContinueN: (n: number) => string;

  tabHome: string;
  tabMarkets: string;
  tabAlerts: string;
  tabProfile: string;
  tabLearn: string;

  homeGreetingMorning: string;
  homeGreetingAfternoon: string;
  homeGreetingEvening: string;
  homeMarketOpen: string;
  homeMarketClosed: string;
  homeYourCrops: string;
  watchlistEmptyTitle: string;
  watchlistEmptyBody: string;
  watchlistAddMore: string;
  topGainers: string;
  topLosers: string;
  topArrivals: string;
  homeQuickTools: string;
  homeTipOfDay: string;
  homeWeatherToday: string;
  homeWeatherTomorrow: string;
  homeForecastNextDays: string;

  catVeg: string;
  catFruit: string;
  catGrain: string;
  catTurbhe: string;

  priceAvg: string;
  priceMin: string;
  priceMax: string;
  arrival: string;
  perQuintal: string;
  perKg: string;
  noPriceToday: string;
  vsYesterday: string;

  detailTrend7d: string;
  detailTrend30d: string;
  detailAddWatch: string;
  detailRemoveWatch: string;
  detailSetAlert: string;
  detailShare: string;
  detailSource: string;
  detailVerdictSellTitle: string;
  detailVerdictSellBody: string;
  detailVerdictHoldTitle: string;
  detailVerdictHoldBody: string;
  detailVerdictNeutralTitle: string;
  detailVerdictNeutralBody: string;
  detailCalendarTitle: string;
  detailCalendarSowing: string;
  detailCalendarHarvest: string;
  detailCalculatorTitle: string;
  detailCalculatorArea: string;
  detailCalculatorYield: string;
  detailCalculatorCost: string;
  detailCalculatorEstRevenue: string;
  detailCalculatorEstProfit: string;
  detailCalculatorUnit: string;

  alertsTitle: string;
  alertsEmpty: string;
  alertsSimulateDigest: string;
  alertsDigestPreviewTitle: string;

  profileTitle: string;
  profileLanguage: string;
  profileUnitToggle: string;
  profileUnitPerQtl: string;
  profileUnitPerKg: string;
  profileNumeralsToggle: string;
  profileNumeralsDeva: string;
  profileNumeralsLatin: string;
  profileName: string;
  profileVillage: string;
  profileSource: string;
  profileVersion: string;
  profileMockBanner: string;

  shareMsg: (name: string, price: string, date: string) => string;

  // ─── Stage 3 ─
  tabTrade: string;
  tradeTitle: string;
  tradeListings: string;
  tradeBuyers: string;
  tradeTransport: string;
  tradeEmptyListings: string;
  tradeCreateListing: string;
  tradeContactSeller: string;
  tradeQuality: string;
  tradeQualityPremium: string;
  tradeQualityStandard: string;
  tradeQualityValue: string;
  tradeNegotiable: string;
  tradeFixed: string;
  tradeQuantity: string;
  tradeVillage: string;
  tradeDistrict: string;
  tradeReadyFrom: string;
  tradeNotes: string;
  tradePhotos: string;
  tradeAskPrice: string;
  tradePublish: string;
  tradeInquireTitle: string;
  tradeInquireMessage: string;
  tradeOfferPrice: string;
  tradeSendInquiry: string;

  transportOffers: string;
  transportRequests: string;
  transportFrom: string;
  transportTo: string;
  transportCapacity: string;
  transportTruckType: string;
  transportAvailableFrom: string;
  transportPrice: string;
  transportCreateOffer: string;
  transportCreateRequest: string;

  premiumTitle: string;
  premiumTagline: string;
  premiumFeatureMultiMarket: string;
  premiumFeatureHistory: string;
  premiumFeatureSms: string;
  premiumFeatureExport: string;
  premiumFeatureSupport: string;
  premiumPlanMonthly: string;
  premiumPlanYearly: string;
  premiumYearlySavings: string;
  premiumSubscribe: string;
  premiumActive: string;
  premiumExpires: string;
  premiumLocked: string;
  premiumUnlock: string;
  multiMarketTitle: string;

  profileSmsFallback: string;
  profileAnalyticsOptIn: string;
  profileLogout: string;

  // ─── Stage 4: Marathi-first, graphics, competitor parity ─
  learnTitle: string;
  learnNews: string;
  learnSchemes: string;
  learnHelpline: string;
  learnVideos: string;
  learnCalendar: string;
  learnCropDoctor: string;
  learnCalculator: string;
  learnWeather: string;

  newsTitle: string;
  newsEmpty: string;
  newsReadMore: string;

  schemesTitle: string;
  schemesEligibility: string;
  schemesBenefit: string;
  schemesHowToApply: string;
  schemesLearnMore: string;

  helplineTitle: string;
  helplineTagline: string;
  helplineCall: string;
  helplineKisan: string;
  helplineKisanSub: string;
  helplinePmKisan: string;
  helplinePmKisanSub: string;
  helplineWeather: string;
  helplineWeatherSub: string;
  helplineAgmarknet: string;
  helplineAgmarknetSub: string;

  videosTitle: string;
  videosWatch: string;

  tipOfDay1: string;
  tipOfDay2: string;
  tipOfDay3: string;
  tipOfDay4: string;
  tipOfDay5: string;

  quickToolSchemes: string;
  quickToolHelpline: string;
  quickToolCalculator: string;
  quickToolCalendar: string;
  quickToolVideos: string;
  quickToolCropDoctor: string;

  heroBrag: string;
  referCta: string;
  referMessage: (link: string) => string;

  // ─── Stage 5: Advisory core ─
  actionsTitle: string;
  actionSpray: string;
  actionIrrigate: string;
  actionHarvest: string;
  actionPlough: string;
  verdictOk: string;
  verdictWarn: string;
  verdictAvoid: string;
  heatStressTitle: string;
  rainRadarTitle: string;
  rainRadarSubtitle: string;
  rainHoursAhead: (n: number) => string;

  stageRibbonTitle: string;
  stageRibbonToday: (day: number, total: number) => string;
  weeklyTasksTitle: string;
  weeklyTasksEmpty: string;
  taskDone: string;
  taskMarkDone: string;
  sowingPromptTitle: string;
  sowingPromptBody: string;
  sowingAddDate: string;
  sowingNotPlanted: string;
  sowingDateLabel: string;
  sowingClear: string;

  countdownTitle: (crop: string) => string;
  countdownDays: (n: number) => string;
  countdownReady: string;
  countdownEstRevenue: (range: string) => string;

  sowNowTitle: string;
  sowNowSubtitle: (month: string) => string;
  sowNowEmpty: string;

  ttsPlay: string;
  ttsStop: string;
  shareAdvisory: string;
  shareWhatsapp: string;

  // ─── Stage 6: Intelligent Co-pilot ─
  weatherLive: string;
  weatherOffline: string;
  weatherLoading: string;
  villagePickerTitle: string;
  villagePickerSub: string;
  villagePickerChange: string;
  villageUseGps: string;
  villageSearchPlaceholder: string;
  askAdvisorTitle: string;
  askAdvisorSub: string;
  askAdvisorHomeTitle: string;
  askAdvisorHomeSub: string;
  askPlaceholder: string;
  askSourceLlm: string;
  diaryTitle: string;
  diarySub: string;
  diaryTally: string;
  diaryEmpty: string;
  diaryActiveCrops: string;
  diaryLog: string;
  diaryEmptyLog: string;
  diaryReset: string;
};

const mr: Dict = {
  appName: 'बाजारभाव',
  tagline: 'मुंबई APMC चा आजचा भाव',

  langMr: 'मराठी',
  langEn: 'English',
  continue: 'पुढे',
  skip: 'वगळा',
  back: 'मागे',
  save: 'जतन करा',
  cancel: 'रद्द करा',
  remove: 'काढा',
  add: 'जोडा',
  done: 'झाले',
  search: 'शोधा',
  loading: 'लोड होत आहे…',
  refresh: 'पुन्हा आणा',
  tryAgain: 'पुन्हा प्रयत्न करा',
  comingSoon: 'लवकरच येत आहे',
  shareWithFriends: 'मित्रांना शेअर करा',
  viewAll: 'सर्व पहा',
  open: 'उघडा',

  onboardingLangTitle: 'भाषा निवडा',
  onboardingLangSubtitle: 'तुम्ही नंतर कधीही बदलू शकता.',

  onboardingCropsTitle: 'तुमची पिके निवडा',
  onboardingCropsSubtitle: 'आम्ही फक्त तुमच्या पिकांचे भाव दाखवू आणि अलर्ट पाठवू.',
  onboardingCropsContinueN: (n) => `पुढे (${n} निवडले)`,

  tabHome: 'मुख्यपृष्ठ',
  tabMarkets: 'बाजार',
  tabAlerts: 'सूचना',
  tabProfile: 'प्रोफाइल',
  tabLearn: 'शिका',

  homeGreetingMorning: 'सुप्रभात',
  homeGreetingAfternoon: 'नमस्कार',
  homeGreetingEvening: 'शुभ संध्याकाळ',
  homeMarketOpen: 'बाजार चालू',
  homeMarketClosed: 'बाजार बंद',
  homeYourCrops: 'तुमची पिके',
  watchlistEmptyTitle: 'तुमची पिके जोडा',
  watchlistEmptyBody: 'तुम्ही पिकवत असलेली पिके जोडा म्हणजे त्यांचे आजचे भाव इथे दिसतील.',
  watchlistAddMore: 'अजून पिके जोडा',
  topGainers: 'आज सर्वाधिक वाढलेले',
  topLosers: 'आज सर्वाधिक घटलेले',
  topArrivals: 'आज सर्वाधिक आवक',
  homeQuickTools: 'उपयुक्त साधने',
  homeTipOfDay: 'आजचा सल्ला',
  homeWeatherToday: 'आजचे हवामान',
  homeWeatherTomorrow: 'उद्याचे हवामान',
  homeForecastNextDays: 'पुढील दिवस',

  catVeg: 'पालेभाजी',
  catFruit: 'फळे',
  catGrain: 'धान्य',
  catTurbhe: 'तुर्भे',

  priceAvg: 'सरासरी',
  priceMin: 'किमान',
  priceMax: 'कमाल',
  arrival: 'आवक',
  perQuintal: 'प्रति क्विंटल',
  perKg: 'प्रति किलो',
  noPriceToday: 'आज भाव उपलब्ध नाही',
  vsYesterday: 'काल पेक्षा',

  detailTrend7d: '७ दिवसांचा कल',
  detailTrend30d: '३० दिवसांचा कल',
  detailAddWatch: 'आवडत्या पिकांत जोडा',
  detailRemoveWatch: 'आवडत्या पिकांतून काढा',
  detailSetAlert: 'भाव अलर्ट सेट करा',
  detailShare: 'शेअर करा',
  detailSource: 'स्रोत: apmcmumbai.org',
  detailVerdictSellTitle: 'विकायला चांगला दिवस',
  detailVerdictSellBody: 'मागच्या आठवड्यापेक्षा भाव वाढले आहेत.',
  detailVerdictHoldTitle: 'थांबा, भाव वाढू शकतो',
  detailVerdictHoldBody: 'गेल्या काही दिवसांत भाव घसरले आहेत.',
  detailVerdictNeutralTitle: 'भाव स्थिर आहेत',
  detailVerdictNeutralBody: 'मोठा बदल दिसत नाही.',
  detailCalendarTitle: 'पीक दिनदर्शिका',
  detailCalendarSowing: 'पेरणी',
  detailCalendarHarvest: 'काढणी',
  detailCalculatorTitle: 'नफा गणक',
  detailCalculatorArea: 'क्षेत्र (एकर)',
  detailCalculatorYield: 'उत्पादन (क्विंटल/एकर)',
  detailCalculatorCost: 'खर्च (₹/एकर)',
  detailCalculatorEstRevenue: 'अंदाजे उत्पन्न',
  detailCalculatorEstProfit: 'अंदाजे नफा',
  detailCalculatorUnit: 'आजच्या सरासरी भावानुसार',

  alertsTitle: 'सूचना',
  alertsEmpty: 'अजून कोणतीही सूचना नाही.',
  alertsSimulateDigest: 'उद्याची नोटिफिकेशन पहा',
  alertsDigestPreviewTitle: 'उद्या सकाळी ७:३० ला अशी नोटिफिकेशन येईल:',

  profileTitle: 'प्रोफाइल',
  profileLanguage: 'भाषा',
  profileUnitToggle: 'भावाचे युनिट',
  profileUnitPerQtl: 'प्रति क्विंटल',
  profileUnitPerKg: 'प्रति किलो',
  profileNumeralsToggle: 'अंक',
  profileNumeralsDeva: 'मराठी (०१२)',
  profileNumeralsLatin: 'Latin (012)',
  profileName: 'नाव',
  profileVillage: 'गाव / तालुका',
  profileSource: 'स्रोत: apmcmumbai.org',
  profileVersion: 'आवृत्ती ०.५.० (Stage 5)',
  profileMockBanner: 'हे डेमो डेटा आहे. खऱ्या API साठी सेटिंग्स पहा.',

  shareMsg: (name, price, date) =>
    `${name} — ${price}\nदिनांक: ${date}\nस्रोत: बाजारभाव ॲप (APMC मुंबई)`,

  tabTrade: 'व्यापार',
  tradeTitle: 'मंडई',
  tradeListings: 'शेतकरी विक्री',
  tradeBuyers: 'व्यापारी',
  tradeTransport: 'वाहतूक',
  tradeEmptyListings: 'सध्या कोणतीही विक्री नोंद नाही. पहिली नोंद तुम्ही करा!',
  tradeCreateListing: 'नवीन विक्री नोंद करा',
  tradeContactSeller: 'शेतकऱ्याशी संपर्क साधा',
  tradeQuality: 'दर्जा',
  tradeQualityPremium: 'उत्तम',
  tradeQualityStandard: 'मध्यम',
  tradeQualityValue: 'सामान्य',
  tradeNegotiable: 'वाटाघाट शक्य',
  tradeFixed: 'ठोस किंमत',
  tradeQuantity: 'मात्रा (क्विंटल)',
  tradeVillage: 'गाव',
  tradeDistrict: 'जिल्हा',
  tradeReadyFrom: 'तयार दिनांक',
  tradeNotes: 'टिपण्या',
  tradePhotos: 'फोटो',
  tradeAskPrice: 'अपेक्षित भाव (₹/क्विंटल)',
  tradePublish: 'प्रकाशित करा',
  tradeInquireTitle: 'विचारणा पाठवा',
  tradeInquireMessage: 'संदेश',
  tradeOfferPrice: 'ऑफर भाव (ऐच्छिक)',
  tradeSendInquiry: 'विचारणा पाठवा',

  transportOffers: 'उपलब्ध वाहने',
  transportRequests: 'वाहनाची गरज',
  transportFrom: 'कडून',
  transportTo: 'पर्यंत',
  transportCapacity: 'क्षमता (क्विंटल)',
  transportTruckType: 'वाहन प्रकार',
  transportAvailableFrom: 'उपलब्ध दिनांक',
  transportPrice: 'भाव (ऐच्छिक)',
  transportCreateOffer: 'वाहन उपलब्ध करा',
  transportCreateRequest: 'वाहतूक विनंती करा',

  premiumTitle: 'प्रीमियम',
  premiumTagline: 'जास्त बाजार, अधिक माहिती.',
  premiumFeatureMultiMarket: 'पुणे, नाशिक, सोलापूर APMC चे भाव',
  premiumFeatureHistory: '१ वर्षाचा भाव इतिहास',
  premiumFeatureSms: 'स्मार्टफोन नसेल तरी SMS अलर्ट',
  premiumFeatureExport: 'डेटा CSV एक्सपोर्ट',
  premiumFeatureSupport: 'प्राधान्याने मदत',
  premiumPlanMonthly: 'महिना',
  premiumPlanYearly: 'वर्ष',
  premiumYearlySavings: '१५% बचत',
  premiumSubscribe: 'सुरू करा',
  premiumActive: 'प्रीमियम चालू',
  premiumExpires: 'समाप्त:',
  premiumLocked: 'प्रीमियम वैशिष्ट्य',
  premiumUnlock: 'प्रीमियम सुरू करा',
  multiMarketTitle: 'बाजार तुलना',

  profileSmsFallback: 'SMS अलर्ट सुरू करा',
  profileAnalyticsOptIn: 'ॲप सुधारण्यासाठी वापराची माहिती द्या',
  profileLogout: 'लॉगआउट',

  learnTitle: 'शिका',
  learnNews: 'कृषी बातम्या',
  learnSchemes: 'शासकीय योजना',
  learnHelpline: 'शेतकरी हेल्पलाइन',
  learnVideos: 'व्हिडीओ मार्गदर्शन',
  learnCalendar: 'पीक दिनदर्शिका',
  learnCropDoctor: 'पीक डॉक्टर',
  learnCalculator: 'नफा गणक',
  learnWeather: 'हवामान',

  newsTitle: 'कृषी बातम्या',
  newsEmpty: 'सध्या बातम्या उपलब्ध नाहीत.',
  newsReadMore: 'पुढे वाचा',

  schemesTitle: 'शासकीय योजना',
  schemesEligibility: 'पात्रता',
  schemesBenefit: 'लाभ',
  schemesHowToApply: 'अर्ज कसा करावा',
  schemesLearnMore: 'अधिक माहिती',

  helplineTitle: 'शेतकरी हेल्पलाइन',
  helplineTagline: 'एका कॉलवर मोफत सल्ला.',
  helplineCall: 'कॉल करा',
  helplineKisan: 'किसान कॉल सेंटर',
  helplineKisanSub: 'मोफत — सकाळी ६ ते रात्री १०',
  helplinePmKisan: 'पीएम-किसान हेल्पलाइन',
  helplinePmKisanSub: 'हप्त्याशी संबंधित शंकांसाठी',
  helplineWeather: 'हवामान हेल्पलाइन',
  helplineWeatherSub: 'भारतीय हवामान विभाग (IMD)',
  helplineAgmarknet: 'मंडी हेल्पलाइन',
  helplineAgmarknetSub: 'AGMARKNET दर व बाजार माहिती',

  videosTitle: 'व्हिडीओ मार्गदर्शन',
  videosWatch: 'पहा',

  tipOfDay1: 'आज भाव तपासून नंतर बाजारात जा — प्रवास खर्च वाचेल.',
  tipOfDay2: 'सकाळी लवकर येणाऱ्या मालाला जास्त भाव मिळतो.',
  tipOfDay3: 'मालाची प्रतवारी केल्यास भाव वाढतो.',
  tipOfDay4: 'किमान ३ दलालांकडून भाव विचारा.',
  tipOfDay5: 'हप्त्याच्या शेवटी भाव तपासा — रविवारी बाजार बंद असतो.',

  quickToolSchemes: 'योजना',
  quickToolHelpline: 'हेल्पलाइन',
  quickToolCalculator: 'नफा गणक',
  quickToolCalendar: 'दिनदर्शिका',
  quickToolVideos: 'व्हिडीओ',
  quickToolCropDoctor: 'पीक डॉक्टर',

  heroBrag: 'मुंबई, पुणे, नाशिक व सोलापूर APMC — एकाच ॲपमध्ये',
  referCta: 'गाववाल्यांनाही सांगा',
  referMessage: (link) =>
    `बाजारभाव ॲप वापरून पहा — APMC चे आजचे भाव मराठीत.\n${link}`,

  actionsTitle: 'आजचे कामे',
  actionSpray: 'फवारणी',
  actionIrrigate: 'सिंचन',
  actionHarvest: 'कापणी',
  actionPlough: 'नांगरणी',
  verdictOk: 'उत्तम',
  verdictWarn: 'सावध',
  verdictAvoid: 'नको',
  heatStressTitle: 'तुमच्या पिकासाठी',
  rainRadarTitle: 'पुढच्या १२ तासात पाऊस',
  rainRadarSubtitle: 'कधी सुरू होतोय ते पहा',
  rainHoursAhead: (n) => `+${n} तास`,

  stageRibbonTitle: 'पिकाचा टप्पा',
  stageRibbonToday: (day, total) => `आज दिवस ${day} / ${total}`,
  weeklyTasksTitle: 'या आठवड्याची कामे',
  weeklyTasksEmpty: 'या टप्प्यात कोणतेही नियोजित काम नाही. नवीन टप्पा सुरू झाल्यावर दिसतील.',
  taskDone: 'पूर्ण',
  taskMarkDone: 'पूर्ण झाले',
  sowingPromptTitle: 'तुम्ही हे कधी लावले?',
  sowingPromptBody: 'लागवड तारीख दिल्यास, आम्ही तुमच्या पिकाचा टप्पा, कामे व काढणीचा अंदाज दाखवू.',
  sowingAddDate: 'तारीख जोडा',
  sowingNotPlanted: 'अजून लावले नाही',
  sowingDateLabel: 'लागवड दिनांक',
  sowingClear: 'तारीख काढा',

  countdownTitle: (crop) => `${crop} — काढणी`,
  countdownDays: (n) => `${n} दिवस बाकी`,
  countdownReady: 'काढणीसाठी तयार',
  countdownEstRevenue: (range) => `अंदाजे उत्पन्न: ${range}`,

  sowNowTitle: 'आत्ता लावण्यासाठी',
  sowNowSubtitle: (month) => `${month} मध्ये लागवडीची हंगाम`,
  sowNowEmpty: 'या महिन्यात कोणतीही शिफारस नाही. बाजार पहा.',

  ttsPlay: 'ऐका',
  ttsStop: 'थांबवा',
  shareAdvisory: 'सल्ला शेअर करा',
  shareWhatsapp: 'व्हॉट्सॲप',

  weatherLive: 'थेट',
  weatherOffline: 'ऑफलाईन',
  weatherLoading: 'आणत आहे…',
  villagePickerTitle: 'तुमचे गाव',
  villagePickerSub: 'हवामान व सल्ले तुमच्या जवळच्या केंद्रानुसार दिसतील.',
  villagePickerChange: 'बदला',
  villageUseGps: 'सध्याच्या ठिकाणावरून निवडा',
  villageSearchPlaceholder: 'गाव किंवा पिनकोड शोधा',
  askAdvisorTitle: 'सल्लागाराला विचारा',
  askAdvisorSub: 'हवामान, फवारणी, काढणी — काहीही विचारा.',
  askAdvisorHomeTitle: 'तुमचा शेती सल्लागार',
  askAdvisorHomeSub: 'आज काय करू, केव्हा फवारू — एका क्लिकवर उत्तर',
  askPlaceholder: 'तुमचा प्रश्न लिहा…',
  askSourceLlm: 'किसान-AI उत्तर',
  diaryTitle: 'शेतडायरी',
  diarySub: 'तुमच्या कामांची नोंद एकाच ठिकाणी.',
  diaryTally: 'या हंगामातली कामे',
  diaryEmpty: 'अजून कोणतीही नोंद नाही.',
  diaryActiveCrops: 'चालू पिके',
  diaryLog: 'नोंदी',
  diaryEmptyLog: 'पिकांच्या तपशीलात "काम पूर्ण" वर क्लिक करून नोंदी सुरू करा.',
  diaryReset: 'हे पीक पुन्हा सुरू करा',
};

const en: Dict = {
  appName: 'BajarBhav',
  tagline: "Today's Mumbai APMC prices",

  langMr: 'मराठी',
  langEn: 'English',
  continue: 'Continue',
  skip: 'Skip',
  back: 'Back',
  save: 'Save',
  cancel: 'Cancel',
  remove: 'Remove',
  add: 'Add',
  done: 'Done',
  search: 'Search',
  loading: 'Loading…',
  refresh: 'Refresh',
  tryAgain: 'Try again',
  comingSoon: 'Coming soon',
  shareWithFriends: 'Share with friends',
  viewAll: 'View all',
  open: 'Open',

  onboardingLangTitle: 'Choose language',
  onboardingLangSubtitle: 'You can change it anytime.',

  onboardingCropsTitle: 'Pick your crops',
  onboardingCropsSubtitle: "We'll show prices and alerts only for what you grow.",
  onboardingCropsContinueN: (n) => `Continue (${n} selected)`,

  tabHome: 'Home',
  tabMarkets: 'Markets',
  tabAlerts: 'Alerts',
  tabProfile: 'Profile',
  tabLearn: 'Learn',

  homeGreetingMorning: 'Good morning',
  homeGreetingAfternoon: 'Good afternoon',
  homeGreetingEvening: 'Good evening',
  homeMarketOpen: 'Market open',
  homeMarketClosed: 'Market closed',
  homeYourCrops: 'Your crops',
  watchlistEmptyTitle: 'Add your crops',
  watchlistEmptyBody: "Pick the crops you grow and we'll show today's prices here.",
  watchlistAddMore: 'Add more crops',
  topGainers: "Today's gainers",
  topLosers: "Today's losers",
  topArrivals: 'Highest arrivals',
  homeQuickTools: 'Quick tools',
  homeTipOfDay: 'Tip of the day',
  homeWeatherToday: "Today's weather",
  homeWeatherTomorrow: "Tomorrow's weather",
  homeForecastNextDays: 'Next few days',

  catVeg: 'Vegetables',
  catFruit: 'Fruits',
  catGrain: 'Grains',
  catTurbhe: 'Turbhe',

  priceAvg: 'Avg',
  priceMin: 'Min',
  priceMax: 'Max',
  arrival: 'Arrival',
  perQuintal: 'per quintal',
  perKg: 'per kg',
  noPriceToday: 'No price today',
  vsYesterday: 'vs yesterday',

  detailTrend7d: '7-day trend',
  detailTrend30d: '30-day trend',
  detailAddWatch: 'Add to favourites',
  detailRemoveWatch: 'Remove from favourites',
  detailSetAlert: 'Set price alert',
  detailShare: 'Share',
  detailSource: 'Source: apmcmumbai.org',
  detailVerdictSellTitle: 'Good day to sell',
  detailVerdictSellBody: 'Prices are higher than last week.',
  detailVerdictHoldTitle: 'Consider waiting',
  detailVerdictHoldBody: 'Prices have dropped over the past few days.',
  detailVerdictNeutralTitle: 'Stable prices',
  detailVerdictNeutralBody: 'Not much movement lately.',
  detailCalendarTitle: 'Crop calendar',
  detailCalendarSowing: 'Sowing',
  detailCalendarHarvest: 'Harvest',
  detailCalculatorTitle: 'Profit calculator',
  detailCalculatorArea: 'Area (acres)',
  detailCalculatorYield: 'Yield (quintal/acre)',
  detailCalculatorCost: 'Cost (₹/acre)',
  detailCalculatorEstRevenue: 'Estimated revenue',
  detailCalculatorEstProfit: 'Estimated profit',
  detailCalculatorUnit: "At today's average price",

  alertsTitle: 'Alerts',
  alertsEmpty: 'No alerts yet.',
  alertsSimulateDigest: "Preview tomorrow's notification",
  alertsDigestPreviewTitle: "This is what will arrive tomorrow 7:30 AM:",

  profileTitle: 'Profile',
  profileLanguage: 'Language',
  profileUnitToggle: 'Price unit',
  profileUnitPerQtl: 'Per quintal',
  profileUnitPerKg: 'Per kg',
  profileNumeralsToggle: 'Numerals',
  profileNumeralsDeva: 'Devanagari (०१२)',
  profileNumeralsLatin: 'Latin (012)',
  profileName: 'Name',
  profileVillage: 'Village / Taluka',
  profileSource: 'Source: apmcmumbai.org',
  profileVersion: 'Version 0.5.0 (Stage 5)',
  profileMockBanner: 'Demo data shown. Flip to real mode via app.json > expo.extra.apiMode.',

  shareMsg: (name, price, date) =>
    `${name} — ${price}\nDate: ${date}\nSource: BajarBhav app (APMC Mumbai)`,

  tabTrade: 'Trade',
  tradeTitle: 'Marketplace',
  tradeListings: 'Farmer listings',
  tradeBuyers: 'Buyers',
  tradeTransport: 'Transport',
  tradeEmptyListings: 'No listings yet. Be the first to post!',
  tradeCreateListing: 'Post a listing',
  tradeContactSeller: 'Contact seller',
  tradeQuality: 'Quality',
  tradeQualityPremium: 'Premium',
  tradeQualityStandard: 'Standard',
  tradeQualityValue: 'Value',
  tradeNegotiable: 'Negotiable',
  tradeFixed: 'Fixed price',
  tradeQuantity: 'Quantity (quintals)',
  tradeVillage: 'Village',
  tradeDistrict: 'District',
  tradeReadyFrom: 'Ready from',
  tradeNotes: 'Notes',
  tradePhotos: 'Photos',
  tradeAskPrice: 'Ask price (₹/quintal)',
  tradePublish: 'Publish',
  tradeInquireTitle: 'Send inquiry',
  tradeInquireMessage: 'Message',
  tradeOfferPrice: 'Offer price (optional)',
  tradeSendInquiry: 'Send',

  transportOffers: 'Trucks available',
  transportRequests: 'Transport needed',
  transportFrom: 'From',
  transportTo: 'To',
  transportCapacity: 'Capacity (quintals)',
  transportTruckType: 'Truck type',
  transportAvailableFrom: 'Available from',
  transportPrice: 'Quote (optional)',
  transportCreateOffer: 'List a truck',
  transportCreateRequest: 'Post a transport request',

  premiumTitle: 'Premium',
  premiumTagline: 'More markets. Deeper insight.',
  premiumFeatureMultiMarket: 'Pune, Nashik & Solapur APMC prices',
  premiumFeatureHistory: '1-year price history',
  premiumFeatureSms: 'SMS alerts (even without smartphone)',
  premiumFeatureExport: 'Export data to CSV',
  premiumFeatureSupport: 'Priority support',
  premiumPlanMonthly: 'Monthly',
  premiumPlanYearly: 'Yearly',
  premiumYearlySavings: 'Save 15%',
  premiumSubscribe: 'Subscribe',
  premiumActive: 'Premium active',
  premiumExpires: 'Expires:',
  premiumLocked: 'Premium feature',
  premiumUnlock: 'Unlock premium',
  multiMarketTitle: 'Market comparison',

  profileSmsFallback: 'SMS alerts',
  profileAnalyticsOptIn: 'Share usage to improve the app',
  profileLogout: 'Log out',

  learnTitle: 'Learn',
  learnNews: 'Agri news',
  learnSchemes: 'Govt schemes',
  learnHelpline: 'Farmer helpline',
  learnVideos: 'Video guides',
  learnCalendar: 'Crop calendar',
  learnCropDoctor: 'Crop doctor',
  learnCalculator: 'Profit calculator',
  learnWeather: 'Weather',

  newsTitle: 'Agri news',
  newsEmpty: 'No news right now.',
  newsReadMore: 'Read more',

  schemesTitle: 'Government schemes',
  schemesEligibility: 'Eligibility',
  schemesBenefit: 'Benefit',
  schemesHowToApply: 'How to apply',
  schemesLearnMore: 'Learn more',

  helplineTitle: 'Farmer helpline',
  helplineTagline: 'Free advice, just a call away.',
  helplineCall: 'Call',
  helplineKisan: 'Kisan Call Centre',
  helplineKisanSub: 'Free — 6 AM to 10 PM',
  helplinePmKisan: 'PM-Kisan helpline',
  helplinePmKisanSub: 'Installment-related queries',
  helplineWeather: 'Weather helpline',
  helplineWeatherSub: 'India Meteorological Dept. (IMD)',
  helplineAgmarknet: 'Mandi helpline',
  helplineAgmarknetSub: 'AGMARKNET prices & market info',

  videosTitle: 'Video guides',
  videosWatch: 'Watch',

  tipOfDay1: 'Check prices before heading to the mandi — save a wasted trip.',
  tipOfDay2: 'Morning arrivals usually fetch higher prices.',
  tipOfDay3: 'Grade your produce before selling to get a better price.',
  tipOfDay4: 'Get a quote from at least 3 brokers before agreeing.',
  tipOfDay5: 'Sundays the mandi is closed — check prices before travelling.',

  quickToolSchemes: 'Schemes',
  quickToolHelpline: 'Helpline',
  quickToolCalculator: 'Profit calc',
  quickToolCalendar: 'Calendar',
  quickToolVideos: 'Videos',
  quickToolCropDoctor: 'Crop doctor',

  heroBrag: 'Mumbai, Pune, Nashik & Solapur APMC — in one app',
  referCta: 'Tell your neighbours',
  referMessage: (link) =>
    `Try BajarBhav — today's APMC prices in Marathi.\n${link}`,

  actionsTitle: "Today's farm actions",
  actionSpray: 'Spray',
  actionIrrigate: 'Irrigate',
  actionHarvest: 'Harvest',
  actionPlough: 'Plough',
  verdictOk: 'Good',
  verdictWarn: 'Caution',
  verdictAvoid: 'Skip',
  heatStressTitle: 'For your crops',
  rainRadarTitle: 'Rain over the next 12 hours',
  rainRadarSubtitle: 'See when it starts',
  rainHoursAhead: (n) => `+${n} h`,

  stageRibbonTitle: 'Crop stage',
  stageRibbonToday: (day, total) => `Day ${day} of ${total}`,
  weeklyTasksTitle: "This week's tasks",
  weeklyTasksEmpty: 'No scheduled tasks for this stage. New ones appear when the next stage begins.',
  taskDone: 'Done',
  taskMarkDone: 'Mark done',
  sowingPromptTitle: 'When did you plant this?',
  sowingPromptBody: 'Add the sowing date so we can show the crop stage, tasks and expected harvest.',
  sowingAddDate: 'Add date',
  sowingNotPlanted: 'Not planted yet',
  sowingDateLabel: 'Sowing date',
  sowingClear: 'Clear date',

  countdownTitle: (crop) => `${crop} — harvest`,
  countdownDays: (n) => `${n} days to go`,
  countdownReady: 'Ready to harvest',
  countdownEstRevenue: (range) => `Estimated revenue: ${range}`,

  sowNowTitle: 'Plant now',
  sowNowSubtitle: (month) => `Ideal sowing window in ${month}`,
  sowNowEmpty: 'Nothing to plant this month. Check the market instead.',

  ttsPlay: 'Listen',
  ttsStop: 'Stop',
  shareAdvisory: 'Share advisory',
  shareWhatsapp: 'WhatsApp',

  weatherLive: 'Live',
  weatherOffline: 'Offline',
  weatherLoading: 'Fetching…',
  villagePickerTitle: 'Your village',
  villagePickerSub: 'Weather and advisories adapt to your nearest station.',
  villagePickerChange: 'Change',
  villageUseGps: 'Use current location',
  villageSearchPlaceholder: 'Search village or pincode',
  askAdvisorTitle: 'Ask the advisor',
  askAdvisorSub: 'Weather, spraying, harvest — ask anything.',
  askAdvisorHomeTitle: 'Your farming co-pilot',
  askAdvisorHomeSub: 'What to do today, when to spray — one tap away',
  askPlaceholder: 'Type your question…',
  askSourceLlm: 'Kisan-AI answer',
  diaryTitle: 'Farm diary',
  diarySub: 'All your logged tasks in one place.',
  diaryTally: 'Tasks this season',
  diaryEmpty: 'No entries yet.',
  diaryActiveCrops: 'Active crops',
  diaryLog: 'Log',
  diaryEmptyLog: 'Tick "mark done" on a crop page to start logging.',
  diaryReset: 'Restart this crop',
};

export const DICT: Record<Language, Dict> = { mr, en };

export type { Dict };
