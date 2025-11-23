import { useState, useEffect, useCallback } from "react";

interface UseAudioDevicesReturn {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (deviceId: string) => void;
  updateDevices: () => Promise<boolean>;
  isUpdating: boolean;
  error: Error | null;
}

export function useAudioDevices(): UseAudioDevicesReturn {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateDevices = useCallback(async (): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(
        (device) => device.kind === "audioinput",
      );

      const currentDeviceIds = devices.map((d) => d.deviceId).sort();
      const newDeviceIds = audioInputs.map((d) => d.deviceId).sort();
      const hasChanged =
        currentDeviceIds.length !== newDeviceIds.length ||
        !currentDeviceIds.every((id, index) => id === newDeviceIds[index]);

      if (hasChanged || devices.length === 0) {
        setDevices(audioInputs);
        setError(null);

        if (
          selectedDeviceId !== "default" &&
          !audioInputs.find((d) => d.deviceId === selectedDeviceId)
        ) {
          setSelectedDeviceId("default");
        }

        return true;
      }

      return false;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setDevices([]);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    const getInitialDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(
          (device) => device.kind === "audioinput",
        );
        
        setDevices(audioInputs);
        setError(null);
        
        if (audioInputs.length > 0) {
          const defaultDevice = audioInputs.find(d => d.deviceId === "default") || audioInputs[0];
          setSelectedDeviceId(defaultDevice.deviceId);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setDevices([]);
      }
    };

    getInitialDevices();
  }, []);

  useEffect(() => {
    const handleDeviceChange = () => {
      updateDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    const pollingInterval = setInterval(() => {
      updateDevices();
    }, 3000);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange,
      );
      clearInterval(pollingInterval);
    };
  }, [updateDevices]);

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    updateDevices,
    isUpdating,
    error,
  };
}
