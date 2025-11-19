import { useState, useEffect, useRef, useCallback } from "react";
import { whisperWorkerScript } from "../workers/whisperWorkerScript";

interface UseWhisperOptions {
  language: string;
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export function useWhisper({
  language,
  onTranscript,
  onError,
  enabled = true,
}: UseWhisperOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioDataRef = useRef<Float32Array[]>([]);

  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  const lastAudioDataTimeRef = useRef<number>(Date.now());
  const silenceStartRef = useRef<number | null>(null);
  const segmentStartRef = useRef<number>(Date.now());
  const SILENCE_THRESHOLD = 0.002;
  const SILENCE_DURATION = 500; // 500ms silence to cut segment
  const MAX_SEGMENT_DURATION = 5000; // 5s max segment length

  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onTranscript, onError]);

  useEffect(() => {
    if (!enabled) return;

    let workerUrl: string | null = null;

    if (!workerRef.current) {
      const blob = new Blob([whisperWorkerScript], {
        type: "application/javascript",
      });
      workerUrl = URL.createObjectURL(blob);
      workerRef.current = new Worker(workerUrl, { type: "module" });

      workerRef.current.onmessage = (event) => {
        const { status, message, data } = event.data;

        switch (status) {
          case "loading":
            setIsModelLoading(true);
            if (
              data &&
              data.status === "progress" &&
              typeof data.progress === "number"
            ) {
              setLoadingProgress(Math.round(data.progress));
            } else if (data && data.status === "initiate") {
              setLoadingProgress(0);
            } else if (data && data.status === "done") {
              setLoadingProgress(100);
            }
            break;
          case "ready":
            setIsModelLoading(false);
            setIsModelReady(true);
            setLoadingProgress(100);
            break;
          case "complete":
            isProcessingRef.current = false;
            if (data && typeof data.text === "string") {
              const text = data.text.trim();
              if (text) {
                // Always mark as final because we are processing complete segments
                onTranscriptRef.current(text, true);
              }
            } else if (Array.isArray(data)) {
              const text = data
                .map((item: { text: string }) => item.text)
                .join(" ")
                .trim();
              if (text) {
                onTranscriptRef.current(text, true);
              }
            }
            break;
          case "error":
            isProcessingRef.current = false;
            setIsModelLoading(false);
            if (onErrorRef.current) onErrorRef.current(new Error(message));
            break;
        }
      };

      setIsModelLoading(true);
      workerRef.current.postMessage({ type: "load" });
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, [enabled]);

  const calculateRMS = (data: Float32Array) => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  };

  const startListening = useCallback(
    async (deviceId?: string) => {
      if (!isModelReady) {
        return;
      }

      try {
        const constraints = {
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        const source = audioContextRef.current.createMediaStreamSource(stream);

        const processor = audioContextRef.current.createScriptProcessor(
          4096,
          1,
          1,
        );
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContextRef.current.destination);

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const rms = calculateRMS(inputData);

          if (rms < SILENCE_THRESHOLD) {
            if (silenceStartRef.current === null) {
              silenceStartRef.current = Date.now();
            }
          } else {
            silenceStartRef.current = null;
          }

          audioDataRef.current.push(new Float32Array(inputData));
          lastAudioDataTimeRef.current = Date.now();
        };

        setIsListening(true);
        segmentStartRef.current = Date.now(); // Reset segment start
      } catch (err) {
        if (onErrorRef.current)
          onErrorRef.current(
            err instanceof Error ? err : new Error(String(err)),
          );
      }
    },
    [isModelReady],
  );

  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
      audioContextRef.current.close();
      processorRef.current = null;
      audioContextRef.current = null;
    }

    setIsListening(false);
    audioDataRef.current = [];
    silenceStartRef.current = null;
    isProcessingRef.current = false;
  }, []);

  // Periodic processing loop - SEGMENTED STRATEGY
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isListening) {
      interval = setInterval(() => {
        if (audioDataRef.current.length > 0) {
          const now = Date.now();
          const segmentDuration = now - segmentStartRef.current;
          const silenceDuration = silenceStartRef.current
            ? now - silenceStartRef.current
            : 0;

          // Trigger processing if:
          // 1. Silence > 500ms (Natural pause)
          // 2. Duration > 5000ms (Max segment length)

          const shouldProcess =
            silenceDuration > SILENCE_DURATION ||
            segmentDuration > MAX_SEGMENT_DURATION;

          if (shouldProcess && !isProcessingRef.current) {
            // Calculate total length
            const totalLength = audioDataRef.current.reduce(
              (acc, chunk) => acc + chunk.length,
              0,
            );

            // Only process if meaningful audio (> 0.2s)
            if (totalLength > 16000 * 0.2) {
              const mergedAudio = new Float32Array(totalLength);
              let offset = 0;
              for (const chunk of audioDataRef.current) {
                mergedAudio.set(chunk, offset);
                offset += chunk.length;
              }

              isProcessingRef.current = true;
              if (workerRef.current) {
                workerRef.current.postMessage({
                  type: "generate",
                  data: {
                    audio: mergedAudio,
                    language: language.split("-")[0],
                  },
                });
              }
            }

            // ALWAYS clear buffer and reset segment after processing trigger
            // This ensures we start a fresh segment for the next phrase
            audioDataRef.current = [];
            silenceStartRef.current = null;
            segmentStartRef.current = Date.now();
          }
        }
      }, 100); // Check frequently (100ms) for precise cuts
    }

    return () => clearInterval(interval);
  }, [isListening, language]);

  return {
    isListening,
    isModelLoading,
    isModelReady,
    loadingProgress,
    startListening,
    stopListening,
  };
}
