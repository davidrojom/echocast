import { useState, useRef, useEffect, useCallback } from "react";

type OverlayWindow =
  | Window
  | {
      close: () => Promise<void> | void;
      closed: boolean;
      updateText?: (original: string, translated: string) => void;
    };

interface UseOverlayWindowOptions {
  targetLanguage: string;
  getLanguageFlag: (code: string) => string;
  onReset: () => void;
}

interface UseOverlayWindowReturn {
  isOpen: boolean;
  overlayType: "pip" | "popup" | null;
  openOverlay: () => Promise<void>;
  closeOverlay: () => void;
  updateSubtitles: (subtitle: string, translation: string) => void;
}

export function useOverlayWindow({
  targetLanguage,
  getLanguageFlag,
  onReset,
}: UseOverlayWindowOptions): UseOverlayWindowReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [overlayType, setOverlayType] = useState<"pip" | "popup" | null>(null);
  const overlayWindowRef = useRef<OverlayWindow | null>(null);
  const canvasUpdateRef = useRef<
    ((original: string, translated: string) => void) | null
  >(null);
  const currentTranscriptRef = useRef<string>("");
  const currentTranslationRef = useRef<string>("");

  const createPictureInPictureOverlay = useCallback(async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      const drawText = (originalText: string, translatedText: string) => {
        if (!ctx) return;

        ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";

        const translatedWords = (
          translatedText || "Waiting for audio..."
        ).split(" ");
        let translatedLine = "";
        let translatedY = canvas.height / 2 - 20;
        const translatedLineHeight = 40;
        const maxTranslatedLines = 3;
        let translatedLineCount = 0;
        const maxWidth = canvas.width - 40;

        for (
          let n = 0;
          n < translatedWords.length &&
          translatedLineCount < maxTranslatedLines;
          n++
        ) {
          const testLine = translatedLine + translatedWords[n] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(translatedLine, canvas.width / 2, translatedY);
            translatedLine = translatedWords[n] + " ";
            translatedY += translatedLineHeight;
            translatedLineCount++;
          } else {
            translatedLine = testLine;
          }
        }
        if (translatedLineCount < maxTranslatedLines && translatedLine.trim()) {
          ctx.fillText(translatedLine, canvas.width / 2, translatedY);
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "left";

        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(15, 15, 80, 30);

        ctx.fillStyle = "#ffffff";
        ctx.fillText("CC", 25, 35);

        const targetLanguageFlag = getLanguageFlag(targetLanguage);
        ctx.font = "20px Arial";
        ctx.fillText(targetLanguageFlag, 55, 35);
      };

      drawText("", "");

      const video = document.createElement("video");
      video.style.position = "fixed";
      video.style.top = "-1000px";
      video.style.left = "-1000px";
      video.style.width = "1px";
      video.style.height = "1px";
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;

      document.body.appendChild(video);

      const stream = canvas.captureStream(30);
      video.srcObject = stream;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
        setTimeout(reject, 5000);
      });

      await video.play();
      await new Promise((resolve) => setTimeout(resolve, 100));

      await video.requestPictureInPicture();

      canvasUpdateRef.current = drawText;

      overlayWindowRef.current = {
        close: async () => {
          try {
            await document.exitPictureInPicture();
          } catch (e) {
            console.log("Error closing PiP:", e);
          }
          if (video.parentNode) {
            document.body.removeChild(video);
          }
          canvasUpdateRef.current = null;
        },
        closed: false,
        updateText: (original: string, translated: string) => {
          drawText(original, translated);
        },
      };

      const updateInterval = setInterval(() => {
        if (
          overlayWindowRef.current &&
          !overlayWindowRef.current.closed &&
          canvasUpdateRef.current
        ) {
          canvasUpdateRef.current(
            currentTranscriptRef.current,
            currentTranslationRef.current,
          );
        } else {
          clearInterval(updateInterval);
        }
      }, 100);

      video.addEventListener("leavepictureinpicture", () => {
        clearInterval(updateInterval);
        onReset();
        setIsOpen(false);
        setOverlayType(null);
        overlayWindowRef.current = null;
        canvasUpdateRef.current = null;
        if (video.parentNode) {
          document.body.removeChild(video);
        }
      });
    } catch (error) {
      throw error;
    }
  }, [targetLanguage, getLanguageFlag, onReset]);

  const createPopupOverlay = useCallback(async () => {
    const w = 800;
    const h = 200;
    const x = Math.max(0, (screen.width - w) / 2);
    const y = 50;

    const overlayWindow = window.open(
      "",
      "echocast-overlay",
      `width=${w},height=${h},left=${x},top=${y},resizable=yes,scrollbars=no`,
    );

    if (!overlayWindow) {
      alert("Could not open subtitle window. Check that popups are allowed.");
      return;
    }

    overlayWindowRef.current = overlayWindow;

    try {
      const response = await fetch("/overlay.html");
      if (!response.ok) throw new Error("Failed to load template");
      const htmlContent = await response.text();

      overlayWindow.document.write(htmlContent);
      overlayWindow.document.close();
    } catch (error) {
      console.error("Error loading overlay template:", error);

      overlayWindow.document.write(
        "<html><body><h1>Error loading template</h1></body></html>",
      );
      overlayWindow.document.close();
    }

    setTimeout(() => {
      if (overlayWindow && !overlayWindow.closed) {
        overlayWindow.addEventListener("beforeunload", () => {
          setIsOpen(false);
          setOverlayType(null);
          overlayWindowRef.current = null;
        });

        try {
          overlayWindow.focus();
          overlayWindow.moveBy(0, 0);
        } catch (e) {
          console.log("Error focusing window:", e);
        }
      }
    }, 200);
  }, [targetLanguage, getLanguageFlag]);

  const openOverlay = useCallback(async () => {
    setIsOpen(true);

    if (
      "pictureInPictureEnabled" in document &&
      document.pictureInPictureEnabled
    ) {
      try {
        await createPictureInPictureOverlay();
        setOverlayType("pip");
        return;
      } catch (error) {
        console.log("Picture-in-Picture failed, using normal popup:", error);
      }
    } else {
      console.log("Picture-in-Picture is not available in this browser");
    }

    createPopupOverlay();
    setOverlayType("popup");
  }, [onReset, createPictureInPictureOverlay, createPopupOverlay]);

  const closeOverlay = useCallback(() => {
    setIsOpen(false);
    setOverlayType(null);
    if (overlayWindowRef.current) {
      overlayWindowRef.current.close();
      overlayWindowRef.current = null;
    }
  }, []);

  const updateSubtitles = useCallback(
    (subtitle: string, translation: string) => {
      currentTranscriptRef.current = subtitle;
      currentTranslationRef.current = translation;

      if (
        isOpen &&
        overlayWindowRef.current &&
        !overlayWindowRef.current.closed
      ) {
        try {
          if (
            "updateText" in overlayWindowRef.current &&
            overlayWindowRef.current.updateText
          ) {
            overlayWindowRef.current.updateText(subtitle, translation);
          } else if ("document" in overlayWindowRef.current) {
            const translationElement =
              overlayWindowRef.current.document.getElementById("translation");

            if (translationElement) {
              translationElement.textContent =
                translation || "Waiting for audio...";
            }

            const languageFlagElement =
              overlayWindowRef.current.document.getElementById("language-flag");
            if (languageFlagElement) {
              languageFlagElement.textContent = getLanguageFlag(targetLanguage);
            }
          }
        } catch {
          console.log("Overlay window closed or inaccessible");
          onReset();
          setIsOpen(false);
          overlayWindowRef.current = null;
        }
      }
    },
    [isOpen, targetLanguage, getLanguageFlag, onReset],
  );

  useEffect(() => {
    return () => {
      if (overlayWindowRef.current) {
        overlayWindowRef.current.close();
      }
    };
  }, []);

  return {
    isOpen,
    overlayType,
    openOverlay,
    closeOverlay,
    updateSubtitles,
  };
}
