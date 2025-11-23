import { useState, useRef, useEffect, useCallback } from "react";
import type {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from "../types/speech";
import { useWhisper } from "./useWhisper";

interface UseSpeechRecognitionOptions {
  language: string;
  audioDeviceId?: string;
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  mode?: "native" | "whisper";
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  error: Error | null;
  isModelLoading?: boolean;
  isModelReady?: boolean;
  loadingProgress?: number;
  mode: "native" | "whisper";
}

export function useSpeechRecognition({
  language,
  audioDeviceId = "default",
  onTranscript,
  onError,
  mode = "whisper",
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isNativeListening, setIsNativeListening] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onTranscript, onError]);

  const {
    isListening: isWhisperListening,
    isModelLoading,
    isModelReady,
    loadingProgress,
    startListening: startWhisper,
    stopListening: stopWhisper,
  } = useWhisper({
    language,
    onTranscript,
    onError,
    enabled: mode === "whisper",
  });

  useEffect(() => {
    const supported =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    setIsSupported(supported);

    if (supported && mode === "native") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript && finalTranscript.trim().length > 0) {
          onTranscriptRef.current(finalTranscript.trim(), true);
        } else if (interimTranscript.trim().length > 0) {
          onTranscriptRef.current(interimTranscript.trim(), false);
        }
      };

      recognitionRef.current.onend = () => {
        if (isNativeListening) {
          // Small delay to prevent rapid restart loops if something is wrong
          setTimeout(() => {
            if (
              recognitionRef.current &&
              isNativeListening &&
              mode === "native"
            ) {
              try {
                recognitionRef.current.start();
              } catch (error) {
                console.log("Error restarting recognition:", error);
              }
            }
          }, 100);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Ignore 'no-speech' errors as they just mean silence
        if (event.error === "no-speech") return;

        const err = new Error(`Speech recognition error: ${event.error}`);
        setError(err);
        if (onErrorRef.current) {
          onErrorRef.current(err);
        }
        if (event.error === "not-allowed") {
          alert("Microphone access denied. Please allow access.");
          setIsNativeListening(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // Prevent restart on cleanup
        recognitionRef.current.stop();
      }
    };
  }, [mode, language]); // Removed onTranscript and onError from dependencies

  const startListening = useCallback(async () => {
    try {
      if (mode === "whisper") {
        await startWhisper(audioDeviceId);
      } else {
        const constraints = {
          audio:
            audioDeviceId !== "default"
              ? { deviceId: { exact: audioDeviceId } }
              : true,
        };

        // Request microphone access first
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (recognitionRef.current) {
          // Ensure we're using the correct language
          recognitionRef.current.lang = language;
          try {
            recognitionRef.current.start();
            setIsNativeListening(true);
            setError(null);
          } catch (e) {
            // If already started, just set state
            console.warn("Speech recognition already started", e);
            setIsNativeListening(true);
          }
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onErrorRef.current) {
        onErrorRef.current(error);
      }
      throw error;
    }
  }, [language, audioDeviceId, mode, startWhisper]);

  const stopListening = useCallback(() => {
    if (mode === "whisper") {
      stopWhisper();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setIsNativeListening(false);
    }
  }, [mode, stopWhisper]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isListening: mode === "whisper" ? isWhisperListening : isNativeListening,
    isSupported: mode === "whisper" ? true : isSupported,
    startListening,
    stopListening,
    error,
    isModelLoading,
    isModelReady: mode === "whisper" ? isModelReady : true,
    loadingProgress: mode === "whisper" ? loadingProgress : 0,
    mode,
  };
}
