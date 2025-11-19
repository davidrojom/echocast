interface SubtitlePreviewProps {
  isTranslating: boolean;
  getLanguageFlag: (code: string) => string;
}

import { useAppStore } from "../stores/appStore";

export function SubtitlePreview({
  isTranslating,
  getLanguageFlag,
}: SubtitlePreviewProps) {
  const {
    targetLanguage,
    displaySubtitle: subtitle,
    displayTranslation: translation,
    isListening,
  } = useAppStore();
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Subtitle preview
      </h3>
      <div
        className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 min-h-32"
        suppressHydrationWarning={true}
      >
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Original transcription (preview only):
        </div>
        <div
          className="text-lg text-gray-900 dark:text-white mb-4 min-h-[1.75rem]"
          suppressHydrationWarning={true}
        >
          {subtitle ||
            (isListening
              ? "Waiting for audio..."
              : "What you say will appear here...")}
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Subtitles in presentation mode {getLanguageFlag(targetLanguage)}:
        </div>
        <div
          className="text-xl font-semibold text-blue-600 dark:text-blue-400 min-h-[2rem]"
          suppressHydrationWarning={true}
        >
          {isTranslating ? (
            <span className="animate-pulse">Translating...</span>
          ) : (
            translation ||
            (isListening
              ? "Waiting for translation..."
              : "Here the translation will appear...")
          )}
        </div>
      </div>
    </div>
  );
}
