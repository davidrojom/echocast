interface InstructionsPanelProps {
  isSpeechSupported: boolean | null;
}

export function InstructionsPanel({
  isSpeechSupported,
}: InstructionsPanelProps) {
  return (
    <>

      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          How to use EchoCast:
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>Select the source language and target language</li>
          <li>
            Click &ldquo;Start recording&rdquo; and allow microphone access
          </li>
          <li>Speak in your native language to test transcription</li>
          <li>
            When ready to present, click &ldquo;Presentation mode&rdquo;
          </li>
          <li>
            It will try to use <strong>Picture-in-Picture</strong> (always on
            top) or popup window
          </li>
          <li>
            In popup: <strong>Click on ⛶</strong> or <strong>F11</strong> for
            borderless fullscreen
          </li>
          <li>
            <strong>ESC</strong> to exit fullscreen
          </li>
        </ol>

        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            🎯 Picture-in-Picture: True Always-on-Top
          </h5>
          <p className="text-sm text-green-700 dark:text-green-300 mb-2">
            If your browser supports it,{" "}
            <strong>Picture-in-Picture</strong> will be used automatically:
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            ✅ Always visible on top of all applications
            <br />
            ✅ Resizable and movable window
            <br />
            ✅ Cannot be lost behind other windows
            <br />✅ Works even when switching desktop/app
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🔄 Fallback: Popup Window + F11
          </h5>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
            If Picture-in-Picture is not available, a popup window will open:
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            • Press <strong>F11</strong> for borderless fullscreen
            <br />
            • Controls hide automatically
            <br />• Move mouse to show controls temporarily
          </p>
        </div>
      </div>


      {isSpeechSupported === false && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            ⚠️ Your browser does not support speech recognition. Please use
            Google Chrome or Microsoft Edge.
          </p>
        </div>
      )}
    </>
  );
}
