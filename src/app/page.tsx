"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { useClientOnly } from "../hooks/useClientOnly";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useAudioDevices } from "../hooks/useAudioDevices";
import { useSubtitleQueue } from "../hooks/useSubtitleQueue";
import { useOverlayWindow } from "../hooks/useOverlayWindow";
import { useAppStore } from "../stores/appStore";
import { LANGUAGES } from "../data/languages";
import { SubtitlePreview } from "../components/SubtitlePreview";
import { AudioDeviceSelector } from "../components/AudioDeviceSelector";
import { LanguageSettings } from "../components/LanguageSettings";
import { OverlayControls } from "../components/OverlayControls";
import { InstructionsPanel } from "../components/InstructionsPanel";

export default function Home() {
  const {
    sourceLanguage,
    targetLanguage,

    setDisplaySubtitle,
    setDisplayTranslation,
    setIsListening,
    translationProvider,
  } = useAppStore();

  const { translateText, isTranslating } = useTranslation();
  const isClient = useClientOnly();
  const [sttMode, setSttMode] = useState<"native" | "whisper">("whisper");

  const getLanguageFlag = useCallback((langCode: string): string => {
    const language = LANGUAGES.find((lang) => lang.code === langCode);
    return language?.flag || "🌐";
  }, []);

  const {
    devices: audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    isUpdating: isUpdatingDevices,
  } = useAudioDevices();

  const onOverlayUpdate = useCallback(
    (subtitle: string, translation: string) => {
      if (overlayWindowRef.current) {
        overlayWindowRef.current.updateSubtitles(subtitle, translation);
      }
    },
    [],
  );

  const subtitleQueue = useSubtitleQueue({
    translateText: (text, options, context) =>
      translateText({ text, options, context }),
    sourceLanguage,
    targetLanguage,
    onSubtitleUpdate: setDisplaySubtitle,
    onTranslationUpdate: setDisplayTranslation,
    onOverlayUpdate,
    apiProvider: translationProvider,
  });

  const overlayWindowRef = useRef<{
    updateSubtitles: (s: string, t: string) => void;
  } | null>(null);

  const overlayWindow = useOverlayWindow({
    targetLanguage,
    getLanguageFlag,
    onReset: subtitleQueue.reset,
  });

  useEffect(() => {
    overlayWindowRef.current = overlayWindow;
  }, [overlayWindow]);

  const speechRecognition = useSpeechRecognition({
    language: sourceLanguage,
    audioDeviceId: selectedDeviceId,
    mode: sttMode,
    onTranscript: (transcript, isFinal) => {
      subtitleQueue.processNewText(transcript, isFinal);
    },
    onError: (error) => {
      console.error("Speech recognition error:", error);
    },
  });

  useEffect(() => {
    setIsListening(speechRecognition.isListening);
  }, [speechRecognition.isListening, setIsListening]);

  useEffect(() => {
    subtitleQueue.reset();
  }, [sourceLanguage, targetLanguage, subtitleQueue.reset]);

  const toggleListening = async () => {
    if (!speechRecognition.isListening) {
      try {
        await speechRecognition.startListening();
      } catch (error) {
        console.error("Error starting listening:", error);
        alert(
          "Could not access selected microphone. Please allow access or select another device.",
        );
      }
    } else {
      speechRecognition.stopListening();
      subtitleQueue.reset();
    }
  };

  if (!isClient) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
        suppressHydrationWarning={true}
      >
        <div className="text-center">
          <Mic className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            EchoCast
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800"
      suppressHydrationWarning={true}
    >
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Mic className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                EchoCast
              </h1>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Real-time subtitles for presentations
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {speechRecognition.isModelLoading && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                  Downloading AI model for high-accuracy speech recognition...
                </p>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${speechRecognition.loadingProgress || 0}%`,
                  }}
                ></div>
              </div>
              <p className="text-right text-xs text-blue-600 dark:text-blue-400 mt-1">
                {speechRecognition.loadingProgress || 0}%
              </p>
            </div>
          )}

          <LanguageSettings />

          <AudioDeviceSelector
            devices={audioDevices}
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={setSelectedDeviceId}
            isListening={speechRecognition.isListening}
            isUpdatingDevices={isUpdatingDevices}
            sttMode={sttMode}
            onSttModeChange={setSttMode}
          />

          <SubtitlePreview
            isTranslating={isTranslating}
            getLanguageFlag={getLanguageFlag}
          />

          <OverlayControls
            isListening={speechRecognition.isListening}
            isOverlayMode={overlayWindow.isOpen}
            overlayType={overlayWindow.overlayType}
            onStartListening={toggleListening}
            onStopListening={toggleListening}
            onOpenOverlay={overlayWindow.openOverlay}
            onCloseOverlay={overlayWindow.closeOverlay}
            isSpeechSupported={speechRecognition.isSupported}
            isClient={isClient}
            isModelReady={speechRecognition.isModelReady}
            targetLanguage={targetLanguage}
          />

          <InstructionsPanel
            isSpeechSupported={speechRecognition.isSupported}
          />
        </div>
      </main>
    </div>
  );
}
