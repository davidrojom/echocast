import LanguageSelector from "./LanguageSelector";

import { useAppStore } from "../stores/appStore";

export function LanguageSettings() {
  const {
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    isListening,
  } = useAppStore();

  const onSourceChange = (lang: string) => setSourceLanguage(lang);
  const onTargetChange = (lang: string) => setTargetLanguage(lang);
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Language settings
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <LanguageSelector
          value={sourceLanguage}
          onChange={onSourceChange}
          label="Source language (what you speak)"
          disabled={isListening}
          placeholder="Search source language..."
        />

        <LanguageSelector
          value={targetLanguage}
          onChange={onTargetChange}
          label="Target language (translation)"
          disabled={isListening}
          placeholder="Search target language..."
        />
      </div>
    </div>
  );
}
