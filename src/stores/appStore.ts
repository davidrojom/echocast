import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AppState {
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;

  isListening: boolean;
  setIsListening: (listening: boolean) => void;

  displaySubtitle: string;
  displayTranslation: string;
  setDisplaySubtitle: (text: string) => void;
  setDisplayTranslation: (text: string) => void;

  isOverlayOpen: boolean;
  setIsOverlayOpen: (open: boolean) => void;

  clearSubtitles: () => void;
  reset: () => void;

  translationProvider: "gemini" | "mock";
  setTranslationProvider: (provider: "gemini" | "mock") => void;
}

const initialState = {
  sourceLanguage: "es",
  targetLanguage: "en",
  isListening: false,
  displaySubtitle: "",
  displayTranslation: "",
  isOverlayOpen: false,
  translationProvider: "gemini" as const,
};

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      ...initialState,

      setSourceLanguage: (lang) => set({ sourceLanguage: lang }),
      setTargetLanguage: (lang) => set({ targetLanguage: lang }),
      setIsListening: (listening) => set({ isListening: listening }),
      setDisplaySubtitle: (text) => set({ displaySubtitle: text }),
      setDisplayTranslation: (text) => set({ displayTranslation: text }),
      setIsOverlayOpen: (open) => set({ isOverlayOpen: open }),

      clearSubtitles: () =>
        set({
          displaySubtitle: "",
          displayTranslation: "",
        }),

      reset: () => set(initialState),

      translationProvider: "gemini",
      setTranslationProvider: (provider) =>
        set({ translationProvider: provider }),
    }),
    { name: "EchoCast App Store" }
  )
);
