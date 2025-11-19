import { useMutation } from "@tanstack/react-query";
import { TranslationServiceFactory, TranslationProvider } from "../services/translation/TranslationServiceFactory";

export interface TranslationOptions {
  sourceLanguage: string;
  targetLanguage: string;
  apiProvider?: TranslationProvider;
}

export const useTranslation = () => {
  const mutation = useMutation({
    mutationFn: async ({
      text,
      options,
      context,
    }: {
      text: string;
      options: TranslationOptions;
      context?: string;
    }) => {
      return await performTranslation(text, options, context);
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    translateText: mutation.mutateAsync,
    isTranslating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
};

async function performTranslation(
  text: string,
  options: TranslationOptions,
  context?: string
): Promise<string> {
  if (!text.trim()) return "";

  const { sourceLanguage, targetLanguage, apiProvider = "mock" } = options;

  try {
    const factory = TranslationServiceFactory.getInstance();
    const service = factory.getService(apiProvider);
    
    return await service.translate(text, sourceLanguage, targetLanguage, context);
  } catch (err) {
    console.error("Translation error:", err);
    throw err;
  }
}
