import { useCallback, useRef, useEffect } from "react";
import { TranslationOptions } from "./useTranslation";

interface UseSubtitleQueueOptions {
  translateText: (
    text: string,
    options: TranslationOptions,
    context?: string
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

interface QueueItem {
  id: number;
  subtitle: string;
  translation: string | null;
  addedAt: number;
  displayStartedAt: number | null;
  status: "pending-transcription" | "pending-translation" | "ready";
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
  const queueRef = useRef<QueueItem[]>([]);
  const currentDisplayIndexRef = useRef<number>(-1);
  const nextItemIdRef = useRef<number>(0);
  const lastTranscriptTimeRef = useRef<number>(0);
  const activeTranscriptItemIdRef = useRef<number | null>(null);

  const NEW_PHRASE_DELAY = 1000;
  const MS_PER_CHARACTER = 50;

  const updateDisplay = useCallback(
    (item: QueueItem | null) => {
      if (!item) {
        onSubtitleUpdate("");
        onTranslationUpdate("");
        if (onOverlayUpdate) {
          onOverlayUpdate("", "");
        }
        return;
      }

      onSubtitleUpdate(item.subtitle);
      onTranslationUpdate(item.translation || "");
      if (onOverlayUpdate) {
        onOverlayUpdate(item.subtitle, item.translation || "");
      }
    },
    [onSubtitleUpdate, onTranslationUpdate, onOverlayUpdate]
  );

  const advanceQueue = useCallback(
    (newIndex: number) => {
      const item = queueRef.current[newIndex];
      if (!item) return;

      currentDisplayIndexRef.current = newIndex;
      item.displayStartedAt = Date.now();
      updateDisplay(item);
    },
    [updateDisplay]
  );

  const performTranslation = useCallback(
    async (itemId: number) => {
      const itemIndex = queueRef.current.findIndex((i) => i.id === itemId);

      if (itemIndex === -1) {
        return;
      }

      const item = queueRef.current[itemIndex];

      if (!item.subtitle.trim()) {
        return;
      }

      try {
        const contextItems = queueRef.current
          .slice(Math.max(0, itemIndex - 3), itemIndex)
          .filter((item) => item.subtitle.trim())
          .map((item) => item.subtitle);

        const contextString = contextItems.join(" ");

        const translation = await translateText(
          item.subtitle,
          {
            sourceLanguage,
            targetLanguage,
            apiProvider,
          },
          contextString || undefined
        );

        item.translation = translation;
        item.status = "ready";

        if (currentDisplayIndexRef.current === itemIndex) {
          updateDisplay(item);
        }
      } catch (error) {
        console.error("Translation error:", error);
        item.translation = "";
        item.status = "ready";
      }
    },
    [translateText, sourceLanguage, targetLanguage, apiProvider, updateDisplay]
  );

  const createNewQueueItem = useCallback(
    (cleanText: string, now: number) => {
      const newItem: QueueItem = {
        id: nextItemIdRef.current++,
        subtitle: cleanText,
        translation: null,
        addedAt: now,
        displayStartedAt: null,
        status: "pending-transcription",
      };

      queueRef.current.push(newItem);
      activeTranscriptItemIdRef.current = newItem.id;

      if (queueRef.current.length === 1) {
        advanceQueue(0);
      }
    },
    [advanceQueue]
  );

  const updateExistingQueueItem = useCallback(
    (cleanText: string) => {
      const activeItemId = activeTranscriptItemIdRef.current;
      if (activeItemId === null) {
        return;
      }

      const item = queueRef.current.find((item) => item.id === activeItemId);
      if (!item) {
        return;
      }

      item.subtitle = cleanText;

      if (
        queueRef.current[currentDisplayIndexRef.current]?.id === activeItemId
      ) {
        updateDisplay(item);
      }
    },
    [updateDisplay]
  );

  const handleFinalTranscript = useCallback(() => {
    const activeItemId = activeTranscriptItemIdRef.current;

    if (activeItemId === null) {
      return;
    }

    const item = queueRef.current.find((i) => i.id === activeItemId);

    if (!item) {
      return;
    }

    item.status = "pending-translation";
    performTranslation(activeItemId);
    activeTranscriptItemIdRef.current = null;
  }, [performTranslation]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = currentDisplayIndexRef.current;
      const queue = queueRef.current;

      if (!queue.length || currentIndex === -1) {
        return;
      }

      const currentItem = queue[currentIndex];

      if (!currentItem) {
        return;
      }

      if (currentIndex === queue.length - 1) {
        return;
      }

      const displayDuration = currentItem.subtitle.length * MS_PER_CHARACTER;

      const timeSinceDisplayed =
        Date.now() - (currentItem.displayStartedAt || 0);

      if (timeSinceDisplayed >= displayDuration) {
        const nextItem = queue[currentIndex + 1];

        if (nextItem?.status === "ready") {
          advanceQueue(currentIndex + 1);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [advanceQueue]);

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
      const timeSinceLastText = now - lastTranscriptTimeRef.current;
      lastTranscriptTimeRef.current = now;

      if (timeSinceLastText > NEW_PHRASE_DELAY) {
        createNewQueueItem(cleanText, now);
      } else {
        updateExistingQueueItem(cleanText);
      }

      if (isFinal) {
        handleFinalTranscript();
      }
    },
    [createNewQueueItem, updateExistingQueueItem, handleFinalTranscript]
  );

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    currentDisplayIndexRef.current = -1;
    activeTranscriptItemIdRef.current = null;
    updateDisplay(null);
  }, [updateDisplay]);

  const reset = useCallback(() => {
    clearQueue();
    lastTranscriptTimeRef.current = 0;
  }, [clearQueue]);

  return {
    processNewText,
    clearQueue,
    reset,
  };
}
