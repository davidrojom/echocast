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
  const canvasUpdateRef = useRef<(() => void) | null>(null);

  const displayQueueRef = useRef<string[]>([]);
  const pendingBufferRef = useRef<string>("");
  const lastInputRef = useRef<string>("");
  const currentSlideRef = useRef<string>("");
  const slideExpiryRef = useRef<number>(0);
  const enqueuedTextLengthRef = useRef<number>(0);

  const createPictureInPictureOverlay = useCallback(async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      const drawText = (text: string) => {
        if (!ctx) return;

        ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const words = (text || "").split(" ");
        let line = "";
        const lines: string[] = [];
        const maxWidth = canvas.width - 60;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + " ";
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        const lineHeight = 32;
        const totalHeight = lines.length * lineHeight;
        const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;

        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], canvas.width / 2, startY + i * lineHeight);
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(15, 15, 80, 30);

        ctx.fillStyle = "#ffffff";
        ctx.fillText("CC", 25, 35);

        const targetLanguageFlag = getLanguageFlag(targetLanguage);
        ctx.font = "20px Arial";
        ctx.fillText(targetLanguageFlag, 55, 35);
      };

      drawText("Waiting for audio...");

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

      canvasUpdateRef.current = () => {
        const now = Date.now();

        if (now >= slideExpiryRef.current) {
          if (displayQueueRef.current.length > 0) {
            const nextChunk = displayQueueRef.current.shift() || "";
            currentSlideRef.current = nextChunk;

            const wordCount = nextChunk.split(" ").length;
            const duration = 1500 + wordCount * 150;
            slideExpiryRef.current = now + duration;
          } else {
            currentSlideRef.current =
              pendingBufferRef.current ||
              (currentSlideRef.current
                ? currentSlideRef.current
                : "Waiting for audio...");

            slideExpiryRef.current = now;
          }
        }

        drawText(currentSlideRef.current);
      };

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
      };

      const updateInterval = setInterval(() => {
        if (
          overlayWindowRef.current &&
          !overlayWindowRef.current.closed &&
          canvasUpdateRef.current
        ) {
          canvasUpdateRef.current();
        } else {
          console.log("PiP Loop stopping", {
            ref: !!overlayWindowRef.current,
            closed: overlayWindowRef.current?.closed,
            updateFn: !!canvasUpdateRef.current,
          });
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

        displayQueueRef.current = [];
        pendingBufferRef.current = "";
        lastInputRef.current = "";
        currentSlideRef.current = "";
        slideExpiryRef.current = 0;
        enqueuedTextLengthRef.current = 0;

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
      `width=${w},height=${h},left=${x},top=${y},resizable=yes,scrollbars=no`
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
        "<html><body><h1>Error loading template</h1></body></html>"
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
      if (overlayType === "pip") {
        const lastInput = lastInputRef.current;

        if (translation.startsWith(lastInput) && lastInput) {
          const alreadyEnqueuedLength = enqueuedTextLengthRef.current;
          const newText = translation.slice(alreadyEnqueuedLength);

          if (newText) {
            pendingBufferRef.current += newText;
            lastInputRef.current = translation;

            enqueuedTextLengthRef.current = translation.length;

            let words = pendingBufferRef.current.trim().split(/\s+/);
            while (words.length > 20) {
              const chunk = words.slice(0, 20).join(" ");
              const remainder = words.slice(20).join(" ");

              displayQueueRef.current.push(chunk);

              pendingBufferRef.current = remainder + (remainder ? " " : "");
              words = pendingBufferRef.current.trim().split(/\s+/);
            }
          }
        } else {
          displayQueueRef.current = [];
          pendingBufferRef.current = translation;
          lastInputRef.current = translation;

          enqueuedTextLengthRef.current = translation.length;

          let words = pendingBufferRef.current.trim().split(/\s+/);
          while (words.length > 20) {
            const chunk = words.slice(0, 20).join(" ");
            const remainder = words.slice(20).join(" ");

            displayQueueRef.current.push(chunk);

            pendingBufferRef.current = remainder + (remainder ? " " : "");
            words = pendingBufferRef.current.trim().split(/\s+/);
          }
        }
      }

      if (
        isOpen &&
        overlayWindowRef.current &&
        !overlayWindowRef.current.closed &&
        overlayType !== "pip"
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
    [isOpen, overlayType, targetLanguage, getLanguageFlag, onReset]
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
