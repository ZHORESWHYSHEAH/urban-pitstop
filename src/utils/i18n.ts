export type Language = 'en' | 'hi' | 'kn' | 'ta' | 'es';

export interface Translations {
  appName: string;
  tagline: string;
  searchPlaceholder: string;
  all: string;
  water: string;
  toilets: string;
  shade: string;
  charging: string;
  breakSpots: string;
  nearbyPlaces: string;
  getDirections: string;
  viewDetails: string;
  recentlyConfirmed: string;
  reportedAvailable: string;
  staleStatus: string;
  conflictingReports: string;
  reportedUnavailable: string;
  unknownStatus: string;
  publicAccess: string;
  customersOnly: string;
  permissionRequired: string;
  free: string;
  wereYouAbleToUse: string;
  yesItWorked: string;
  unavailable: string;
  couldntAccess: string;
  somethingElse: string;
  reportProblem: string;
  confirmUsable: string;
  addPlace: string;
  findTab: string;
  activityTab: string;
  contributeTab: string;
  operatorTab: string;
  adminTab: string;
  pilotCorridor: string;
  reliabilityFirst: string;
  distanceFirst: string;
  clearHistory: string;
  offlineMode: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: 'Urban Pitstop',
    tagline: 'Real-time essential facilities network',
    searchPlaceholder: 'What do you need nearby?',
    all: 'All',
    water: 'Drinking Water',
    toilets: 'Toilets',
    shade: 'Shaded Rest',
    charging: 'Phone Charging',
    breakSpots: 'Short Break',
    nearbyPlaces: 'Nearby Places',
    getDirections: 'Get directions',
    viewDetails: 'View details',
    recentlyConfirmed: 'Recently confirmed',
    reportedAvailable: 'Reported available',
    staleStatus: 'Status may be outdated',
    conflictingReports: 'Conflicting reports',
    reportedUnavailable: 'Reported unavailable',
    unknownStatus: 'Availability unknown',
    publicAccess: 'Public',
    customersOnly: 'Customers only',
    permissionRequired: 'Ask permission',
    free: 'Free',
    wereYouAbleToUse: 'Were you able to use this place?',
    yesItWorked: 'Yes, it worked',
    unavailable: 'It was unavailable',
    couldntAccess: "I couldn't access it",
    somethingElse: 'Something else',
    reportProblem: 'Report a problem',
    confirmUsable: 'Confirm available',
    addPlace: 'Add missing place',
    findTab: 'Find',
    activityTab: 'Activity',
    contributeTab: 'Contribute',
    operatorTab: 'Operator',
    adminTab: 'Admin',
    pilotCorridor: 'Pilot Corridor',
    reliabilityFirst: 'Reliability first',
    distanceFirst: 'Closest distance',
    clearHistory: 'Clear History',
    offlineMode: 'Offline cache active',
  },
  hi: {
    appName: 'अर्बन पिटस्टॉप',
    tagline: 'सत्यापित आवश्यक सुविधाएं',
    searchPlaceholder: 'आसपास आपको क्या चाहिए?',
    all: 'सभी',
    water: 'पीने का पानी',
    toilets: 'शौचालय',
    shade: 'छायादार जगह',
    charging: 'फोन चार्जिंग',
    breakSpots: 'विश्राम स्थल',
    nearbyPlaces: 'आस-पास के स्थान',
    getDirections: 'दिशा-निर्देश पाएं',
    viewDetails: 'विवरण देखें',
    recentlyConfirmed: 'हाल ही में सत्यापित',
    reportedAvailable: 'उपलब्ध बताया गया',
    staleStatus: 'स्थिति पुरानी हो सकती है',
    conflictingReports: 'परस्पर विरोधी रिपोर्ट',
    reportedUnavailable: 'अनुपलब्ध रिपोर्ट किया गया',
    unknownStatus: 'स्थिति अज्ञात',
    publicAccess: 'सार्वजनिक',
    customersOnly: 'केवल ग्राहक',
    permissionRequired: 'अनुमति आवश्यक',
    free: 'निःशुल्क',
    wereYouAbleToUse: 'क्या आप इस सुविधा का उपयोग कर सके?',
    yesItWorked: 'हाँ, यह काम कर रहा था',
    unavailable: 'यह अनुपलब्ध था',
    couldntAccess: 'प्रवेश नहीं मिला',
    somethingElse: 'कुछ और',
    reportProblem: 'समस्या की रिपोर्ट करें',
    confirmUsable: 'उपलब्धता की पुष्टि करें',
    addPlace: 'नया स्थान जोड़ें',
    findTab: 'खोजें',
    activityTab: 'इतिहास',
    contributeTab: 'योगदान',
    operatorTab: 'संचालक',
    adminTab: 'प्रशासक',
    pilotCorridor: 'पायलट क्षेत्र',
    reliabilityFirst: 'विश्वसनीयता पहले',
    distanceFirst: 'दूरी अनुसार',
    clearHistory: 'इतिहास मिटाएं',
    offlineMode: 'ऑफ़लाइन सक्रिय',
  },
  kn: {
    appName: 'ಅರ್ಬನ್ ಪಿಟ್‌ಸ್ಟಾಪ್',
    tagline: 'ನೈಜ ಸಮಯದ ಅಗತ್ಯ ಸೌಲಭ್ಯಗಳು',
    searchPlaceholder: 'ಹತ್ತಿರದಲ್ಲಿ ನಿಮಗೆ ಏನು ಬೇಕು?',
    all: 'ಎಲ್ಲಾ',
    water: 'ಕುಡಿಯುವ ನೀರು',
    toilets: 'ಶೌಚಾಲಯಗಳು',
    shade: 'ನೆರಳಿನ ವಿಶ್ರಾಂತಿ',
    charging: 'ಫೋನ್ ಚಾರ್ಜಿಂಗ್',
    breakSpots: 'ವಿರಾಮ ಸ್ಥಳ',
    nearbyPlaces: 'ಹತ್ತಿರದ ಸ್ಥಳಗಳು',
    getDirections: 'ಮಾರ್ಗ ಪಡೆಯಿರಿ',
    viewDetails: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
    recentlyConfirmed: 'ಇತ್ತೀಚೆಗೆ ದೃಢಪಡಿಸಲಾಗಿದೆ',
    reportedAvailable: 'ಲಭ್ಯವಿದೆ ಎಂದು ವರದಿಯಾಗಿದೆ',
    staleStatus: 'ಸ್ಥಿತಿ ಹಳೆಯದಿರಬಹುದು',
    conflictingReports: 'ವಿರೋಧಾತ್ಮಕ ವರದಿಗಳು',
    reportedUnavailable: 'ಲಭ್ಯವಿಲ್ಲ',
    unknownStatus: 'ಲಭ್ಯತೆ ತಿಳಿದಿಲ್ಲ',
    publicAccess: 'ಸಾರ್ವಜನಿಕ',
    customersOnly: 'ಗ್ರಾಹಕರಿಗೆ ಮಾತ್ರ',
    permissionRequired: 'ಅನುಮತಿ ಕೇಳಿ',
    free: 'ಉಚಿತ',
    wereYouAbleToUse: 'ನೀವು ಈ ಸ್ಥಳವನ್ನು ಬಳಸಲು ಸಾಧ್ಯವಾಯಿತೇ?',
    yesItWorked: 'ಹೌದು, ಕೆಲಸ ಮಾಡಿದೆ',
    unavailable: 'ಲಭ್ಯವಿರಲಿಲ್ಲ',
    couldntAccess: 'ಪ್ರವೇಶ ಸಿಗಲಿಲ್ಲ',
    somethingElse: 'ಬೇರೆ ಏನಾದರೂ',
    reportProblem: 'ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
    confirmUsable: 'ಲಭ್ಯತೆ ದೃಢೀಕರಿಸಿ',
    addPlace: 'ಹೊಸ ಸ್ಥಳ ಸೇರಿಸಿ',
    findTab: 'ಹುಡುಕಿ',
    activityTab: 'ಇತಿಹಾಸ',
    contributeTab: 'ಭಾಗವಹಿಸಿ',
    operatorTab: 'ನಿರ್ವಾಹಕ',
    adminTab: 'ಅಡ್ಮಿನ್',
    pilotCorridor: 'ಪ್ರಾಯೋಗಿಕ ಪ್ರದೇಶ',
    reliabilityFirst: 'ವಿಶ್ವಾಸಾರ್ಹತೆ ಮೊದಲು',
    distanceFirst: 'ದೂರದ ಪ್ರಕಾರ',
    clearHistory: 'ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸಿ',
    offlineMode: 'ಆಫ್‌ಲೈನ್ ಸಕ್ರಿಯ',
  },
  ta: {
    appName: 'அர்பன் பிட்ஸ்டாப்',
    tagline: 'உடனடி அத்தியாவசிய வசதிகள்',
    searchPlaceholder: 'அருகில் உங்களுக்கு என்ன தேவை?',
    all: 'அனைத்தும்',
    water: 'குடிநீர்',
    toilets: 'கழிப்பறைகள்',
    shade: 'நிழல் ஓய்விடம்',
    charging: 'போன் சார்ஜிங்',
    breakSpots: 'இடைவேளை இடம்',
    nearbyPlaces: 'அருகிலுள்ள இடங்கள்',
    getDirections: 'வழிசெலுத்தல்',
    viewDetails: 'விவரங்கள்',
    recentlyConfirmed: 'சமீபத்தில் உறுதியானது',
    reportedAvailable: 'இருப்பதாக தகவல்',
    staleStatus: 'பழைய தகவலாக இருக்கலாம்',
    conflictingReports: 'முரண்பட்ட அறிக்கைகள்',
    reportedUnavailable: 'கிடைக்கவில்லை',
    unknownStatus: 'நிலை தெரியவில்லை',
    publicAccess: 'பொதுமக்கள்',
    customersOnly: 'வாடிக்கையாளர் மட்டும்',
    permissionRequired: 'அனுமதி தேவை',
    free: 'இலவசம்',
    wereYouAbleToUse: 'இதை நீங்கள் பயன்படுத்த முடிந்ததா?',
    yesItWorked: 'ஆம், கிடைத்தது',
    unavailable: 'கிடைக்கவில்லை',
    couldntAccess: 'அனுமதி கிடைக்கவில்லை',
    somethingElse: 'வேறு ஒன்று',
    reportProblem: 'புகார் செய்க',
    confirmUsable: 'உறுதி செய்க',
    addPlace: 'இடத்தைச் சேர்',
    findTab: 'தேடு',
    activityTab: 'வரலாறு',
    contributeTab: 'பங்களிப்பு',
    operatorTab: 'மேலாளர்',
    adminTab: 'நிர்வாகி',
    pilotCorridor: 'பைலட் பகுதி',
    reliabilityFirst: 'நம்பகத்தன்மை முதலில்',
    distanceFirst: 'அருகிலுள்ள தூரம்',
    clearHistory: 'அழிக்கவும்',
    offlineMode: 'ஆஃப்லைன் இயக்கம்',
  },
  es: {
    appName: 'Urban Pitstop',
    tagline: 'Red de instalaciones esenciales en tiempo real',
    searchPlaceholder: '¿Qué necesitas cerca?',
    all: 'Todos',
    water: 'Agua potable',
    toilets: 'Baños',
    shade: 'Sombra y descanso',
    charging: 'Carga de teléfono',
    breakSpots: 'Lugar de descanso',
    nearbyPlaces: 'Lugares cercanos',
    getDirections: 'Cómo llegar',
    viewDetails: 'Ver detalles',
    recentlyConfirmed: 'Confirmado recientemente',
    reportedAvailable: 'Reportado disponible',
    staleStatus: 'El estado puede estar desactualizado',
    conflictingReports: 'Reportes conflictivos',
    reportedUnavailable: 'Reportado no disponible',
    unknownStatus: 'Disponibilidad desconocida',
    publicAccess: 'Público',
    customersOnly: 'Solo clientes',
    permissionRequired: 'Pedir permiso',
    free: 'Gratis',
    wereYouAbleToUse: '¿Pudiste usar este lugar?',
    yesItWorked: 'Sí, funcionó',
    unavailable: 'No estaba disponible',
    couldntAccess: 'No pude acceder',
    somethingElse: 'Otra cosa',
    reportProblem: 'Reportar problema',
    confirmUsable: 'Confirmar disponible',
    addPlace: 'Añadir lugar',
    findTab: 'Buscar',
    activityTab: 'Actividad',
    contributeTab: 'Contribuir',
    operatorTab: 'Operador',
    adminTab: 'Administrador',
    pilotCorridor: 'Área piloto',
    reliabilityFirst: 'Confiabilidad primero',
    distanceFirst: 'Distancia',
    clearHistory: 'Borrar historial',
    offlineMode: 'Modo sin conexión',
  }
};
