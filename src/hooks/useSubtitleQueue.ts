import { useCallback, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TranslationOptions } from "./useTranslation";

interface UseSubtitleQueueOptions {
  translateText: (
    text: string,
    options: TranslationOptions,
    context?: string,
  ) => Promise<string>;
  sourceLanguage: string;
  targetLanguage: string;
  onSubtitleUpdate: (subtitle: string) => void;
  onTranslationUpdate: (translation: string) => void;
  onOverlayUpdate?: (subtitle: string, translation: string) => void;
  apiProvider: "gemini" | "mock";
}

interface UseSubtitleQueueReturn {
  processNewText: (text: string, isFinal: boolean) => void;
  clearQueue: () => void;
  reset: () => void;
}

export function useSubtitleQueue({
  translateText,
  sourceLanguage,
  targetLanguage,
  onSubtitleUpdate,
  onTranslationUpdate,
  onOverlayUpdate,
  apiProvider,
}: UseSubtitleQueueOptions): UseSubtitleQueueReturn {
  const contextAccumulatorRef = useRef<string>("");
  const lastTextArrivalRef = useRef<number>(0);
  const currentTranslationIdRef = useRef<number>(0);

  const NEW_PHRASE_DELAY = 1000;

  const performTranslation = useCallback(
    async (textToTranslate: string) => {
      if (!textToTranslate.trim()) return;

      const translationId = ++currentTranslationIdRef.current;

      try {
        const translation = await translateText(textToTranslate, {
          sourceLanguage,
          targetLanguage,
          apiProvider,
        });

        if (translationId === currentTranslationIdRef.current) {
          onTranslationUpdate(translation);
          if (onOverlayUpdate) {
            onOverlayUpdate(textToTranslate, translation);
          }
        }
      } catch (error) {
        console.error("Translation error:", error);
      }
    },
    [
      translateText,
      sourceLanguage,
      targetLanguage,
      apiProvider,
      onTranslationUpdate,
      onOverlayUpdate,
    ],
  );

  const debouncedTranslate = useDebouncedCallback(performTranslation, 200);

  const processNewText = useCallback(
    (text: string, isFinal: boolean = false) => {
      if (!text.trim() || text.trim().length < 2) return;

      const cleanText = text.trim();
      if (
        /^\[.*\]$/.test(cleanText) ||
        /^\(.*\)$/.test(cleanText) ||
        ["[Música]", "[Music]"].includes(cleanText)
      ) {
        return;
      }

      const now = Date.now();
      const timeSinceLastText = now - lastTextArrivalRef.current;
      lastTextArrivalRef.current = now;

      if (timeSinceLastText > NEW_PHRASE_DELAY) {
        contextAccumulatorRef.current = "";
        onSubtitleUpdate("");
        onTranslationUpdate("");
        debouncedTranslate.cancel();
        currentTranslationIdRef.current++;
      }

      if (!cleanText) return;

      const previousText = contextAccumulatorRef.current
        ? contextAccumulatorRef.current + " "
        : "";
      contextAccumulatorRef.current = previousText + cleanText;

      const fullText = contextAccumulatorRef.current.trim();

      onSubtitleUpdate(fullText);
      debouncedTranslate(fullText);
    },
    [
      debouncedTranslate,
      onSubtitleUpdate,
      onTranslationUpdate,
      NEW_PHRASE_DELAY,
    ],
  );

  const clearQueue = useCallback(() => {
    contextAccumulatorRef.current = "";
    onSubtitleUpdate("");
    onTranslationUpdate("");
  }, [onSubtitleUpdate, onTranslationUpdate]);

  const reset = useCallback(() => {
    clearQueue();
    currentTranslationIdRef.current++;
  }, [clearQueue]);

  return {
    processNewText,
    clearQueue,
    reset,
  };
}
