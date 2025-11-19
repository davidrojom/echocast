export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "auto", name: "Automatic", nativeName: "Auto-detect", flag: "🌐" },

  { code: "es-ES", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "en-US", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "fr-FR", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it-IT", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt-BR", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "ru-RU", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko-KR", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  {
    code: "zh-CN",
    name: "Chinese (Simplified)",
    nativeName: "中文",
    flag: "🇨🇳",
  },
  {
    code: "zh-TW",
    name: "Chinese (Traditional)",
    nativeName: "繁體中文",
    flag: "🇹🇼",
  },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "th-TH", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "vi-VN", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "tr-TR", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },

  { code: "nl-NL", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "sv-SE", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "no-NO", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "da-DK", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "fi-FI", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "pl-PL", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "cs-CZ", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "sk-SK", name: "Slovak", nativeName: "Slovenčina", flag: "🇸🇰" },
  { code: "hu-HU", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  { code: "ro-RO", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  { code: "bg-BG", name: "Bulgarian", nativeName: "Български", flag: "🇧🇬" },
  { code: "hr-HR", name: "Croatian", nativeName: "Hrvatski", flag: "🇭🇷" },
  { code: "sr-RS", name: "Serbian", nativeName: "Српски", flag: "🇷🇸" },
  { code: "sl-SI", name: "Slovenian", nativeName: "Slovenščina", flag: "🇸🇮" },
  { code: "et-EE", name: "Estonian", nativeName: "Eesti", flag: "🇪🇪" },
  { code: "lv-LV", name: "Latvian", nativeName: "Latviešu", flag: "🇱🇻" },
  { code: "lt-LT", name: "Lithuanian", nativeName: "Lietuvių", flag: "🇱🇹" },
  { code: "el-GR", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },

  {
    code: "pt-PT",
    name: "Portuguese (Portugal)",
    nativeName: "Português (Portugal)",
    flag: "🇵🇹",
  },
  { code: "ca-ES", name: "Catalan", nativeName: "Català", flag: "🏴󠁥󠁳󠁣󠁴󠁿" },
  { code: "eu-ES", name: "Basque", nativeName: "Euskera", flag: "🏴󠁥󠁳󠁰󠁶󠁿" },
  { code: "gl-ES", name: "Galician", nativeName: "Galego", flag: "🏴󠁥󠁳󠁧󠁡󠁿" },

  { code: "he-IL", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
  { code: "fa-IR", name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
  { code: "ur-PK", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
  { code: "bn-BD", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "sw-KE", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪" },
  { code: "am-ET", name: "Amharic", nativeName: "አማርኛ", flag: "🇪🇹" },
  { code: "zu-ZA", name: "Zulu", nativeName: "IsiZulu", flag: "🇿🇦" },
  { code: "af-ZA", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦" },

  { code: "is-IS", name: "Icelandic", nativeName: "Íslenska", flag: "🇮🇸" },
  { code: "ga-IE", name: "Irish", nativeName: "Gaeilge", flag: "🇮🇪" },
  { code: "cy-GB", name: "Welsh", nativeName: "Cymraeg", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { code: "mt-MT", name: "Maltese", nativeName: "Malti", flag: "🇲🇹" },

  {
    code: "id-ID",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
  },
  { code: "ms-MY", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "tl-PH", name: "Filipino", nativeName: "Filipino", flag: "🇵🇭" },
  { code: "my-MM", name: "Burmese", nativeName: "မြန်မာ", flag: "🇲🇲" },
  { code: "km-KH", name: "Khmer", nativeName: "ភាសាខ្មែរ", flag: "🇰🇭" },
  { code: "lo-LA", name: "Lao", nativeName: "ລາວ", flag: "🇱🇦" },
  { code: "si-LK", name: "Sinhala", nativeName: "සිංහල", flag: "🇱🇰" },
  { code: "ne-NP", name: "Nepali", nativeName: "नेपाली", flag: "🇳🇵" },
  { code: "mn-MN", name: "Mongolian", nativeName: "Монгол", flag: "🇲🇳" },
];

export const searchLanguages = (
  query: string,
  includeAuto: boolean = false
): Language[] => {
  if (!query.trim()) {
    return includeAuto
      ? LANGUAGES
      : LANGUAGES.filter((lang) => lang.code !== "auto");
  }

  const searchTerm = query.toLowerCase().trim();
  const filteredLanguages = LANGUAGES.filter((lang) => {
    if (!includeAuto && lang.code === "auto") return false;

    return (
      lang.name.toLowerCase().includes(searchTerm) ||
      lang.nativeName.toLowerCase().includes(searchTerm) ||
      lang.code.toLowerCase().includes(searchTerm)
    );
  });

  return filteredLanguages;
};

export const getLanguageByCode = (code: string): Language | undefined => {
  return LANGUAGES.find((lang) => lang.code === code);
};

export const POPULAR_LANGUAGES = [
  "auto",
  "es-ES",
  "en-US",
  "fr-FR",
  "de-DE",
  "it-IT",
  "pt-BR",
  "ru-RU",
  "ja-JP",
  "ko-KR",
  "zh-CN",
  "ar-SA",
  "hi-IN",
];
