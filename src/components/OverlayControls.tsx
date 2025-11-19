import { Mic, MicOff, Play } from "lucide-react";

interface OverlayControlsProps {
  isListening: boolean;
  isOverlayMode: boolean;
  overlayType: "pip" | "popup" | null;
  onStartListening: () => void;
  onStopListening: () => void;
  onOpenOverlay: () => void;
  onCloseOverlay: () => void;
  isSpeechSupported: boolean | null;
  isClient: boolean;
  isModelReady?: boolean;
}

export function OverlayControls({
  isListening,
  isOverlayMode,
  overlayType,
  onStartListening,
  onStopListening,
  onOpenOverlay,
  onCloseOverlay,
  isSpeechSupported,
  isClient,
  isModelReady = true,
}: OverlayControlsProps) {
  return (
    <>

      <div
        className="flex flex-col sm:flex-row gap-4 justify-center"
        suppressHydrationWarning={true}
      >
        <button
          onClick={isListening ? onStopListening : onStartListening}
          disabled={!isClient || isSpeechSupported === false || !isModelReady}
          className={`inline-flex items-center px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl ${
            !isClient || isSpeechSupported === false || !isModelReady
              ? "bg-gray-400 cursor-not-allowed text-white"
              : isListening
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          title={
            !isClient
              ? "Loading..."
              : isSpeechSupported === false
              ? "Browser not compatible"
              : !isModelReady
              ? "Waiting for AI model..."
              : ""
          }
          suppressHydrationWarning={true}
        >
          {isListening ? (
            <>
              <MicOff className="mr-2 h-5 w-5" />
              Stop recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              {isModelReady ? "Start recording" : "Loading model..."}
            </>
          )}
        </button>

        {isListening && !isOverlayMode && (
          <button
            onClick={onOpenOverlay}
            className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl"
          >
            <Play className="mr-2 h-5 w-5" />
            Presentation mode
          </button>
        )}

        {isOverlayMode && (
          <button
            onClick={onCloseOverlay}
            className="inline-flex items-center px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl"
          >
            <MicOff className="mr-2 h-5 w-5" />
            Exit presentation mode
            {overlayType === "pip" ? " (PiP)" : " (Popup)"}
          </button>
        )}
      </div>


      {isOverlayMode && (
        <div
          className={`mt-4 p-3 rounded-lg border ${
            overlayType === "pip"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              overlayType === "pip"
                ? "text-green-800 dark:text-green-200"
                : "text-blue-800 dark:text-blue-200"
            }`}
          >
            {overlayType === "pip"
              ? "🎯 Picture-in-Picture mode active - Always on top window"
              : "🪟 Popup mode active - Press F11 in window for fullscreen"}
          </p>
        </div>
      )}
    </>
  );
}
