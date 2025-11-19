interface AudioDeviceSelectorProps {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
  isListening: boolean;
  isUpdatingDevices: boolean;
}

export function AudioDeviceSelector({
  devices,
  selectedDeviceId,
  onDeviceChange,
  isListening,
  isUpdatingDevices,
  sttMode,
  onSttModeChange,
}: AudioDeviceSelectorProps & {
  sttMode: "native" | "whisper";
  onSttModeChange: (mode: "native" | "whisper") => void;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Audio Settings
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="audioDevice"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Select microphone
          </label>
          <div className="flex gap-2">
            <select
              id="audioDevice"
              value={selectedDeviceId}
              onChange={(e) => onDeviceChange(e.target.value)}
              disabled={isListening}
              data-umami-event="change-audio-device"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="default">Default microphone</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label ||
                    `Microphone ${device.deviceId.substring(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isUpdatingDevices
              ? "🔄 Updating devices..."
              : devices.length === 0
                ? "Loading audio devices..."
                : `${devices.length} device${devices.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recognition Mode
          </label>
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => onSttModeChange("native")}
              disabled={isListening}
              data-umami-event="change-stt-mode"
              data-umami-event-mode="native"
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                sttMode === "native"
                  ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              } disabled:opacity-50`}
            >
              Fast (Native)
            </button>
            <button
              onClick={() => onSttModeChange("whisper")}
              disabled={isListening}
              data-umami-event="change-stt-mode"
              data-umami-event-mode="whisper"
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                sttMode === "whisper"
                  ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              } disabled:opacity-50`}
            >
              High Accuracy (Whisper)
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {sttMode === "whisper"
              ? "Uses local AI model. Requires download on first use."
              : "Uses browser built-in recognition. Faster but less accurate."}
          </p>
        </div>
      </div>
    </div>
  );
}
