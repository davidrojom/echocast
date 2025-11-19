import { LANGUAGES } from '../data/languages';


export function getLanguageFlag(code: string): string {
  const language = LANGUAGES.find((lang) => lang.code === code);
  return language?.flag || "🌐";
}


export function getLanguageName(code: string): string {
  const language = LANGUAGES.find((lang) => lang.code === code);
  return language?.name || code;
}
