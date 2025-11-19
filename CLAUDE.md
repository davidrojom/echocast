# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EchoCast is a Next.js application for generating real-time translated subtitles during presentations. Speakers can speak in their native language and receive overlay subtitles translated into another language. The application supports both browser-native speech recognition and local AI-powered speech recognition using Whisper.

## Development Commands

```bash
# Development (uses Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand with devtools
- **Data Fetching**: TanStack Query (React Query)
- **STT**: Web Speech API + Whisper (via @xenova/transformers)
- **Translation**: Google Gemini AI (with Mock for development)
- **Language Detection**: franc library

### Path Aliases
TypeScript path alias: `echocast/*` → `./src/*`

## Core Architecture

### State Management (Zustand)

Global application state managed through [src/stores/appStore.ts](src/stores/appStore.ts):
- Language selection (source/target)
- Listening state
- Display subtitles and translations
- Translation provider selection
- Overlay window state

### Dual Speech Recognition Modes

The application supports two STT (Speech-to-Text) modes via [src/hooks/useSpeechRecognition.ts](src/hooks/useSpeechRecognition.ts):

1. **Native Mode** (default for browsers with Web Speech API):
   - Uses browser's built-in `SpeechRecognition`
   - Requires internet connection
   - Fast and lightweight

2. **Whisper Mode** (offline AI):
   - Downloads and runs Whisper model locally via Web Worker ([src/workers/whisperWorkerScript.ts](src/workers/whisperWorkerScript.ts))
   - Uses @xenova/transformers for inference
   - Works offline after initial model download
   - Audio processing via AudioContext at 16kHz sample rate
   - Segments audio on silence (500ms threshold) or max duration (5s)
   - Implementation in [src/hooks/useWhisper.ts](src/hooks/useWhisper.ts)

### Hook Architecture & Data Flow

The application follows a layered hook architecture:

```
[page.tsx]
    ↓
[useSpeechRecognition] ← selects between native/whisper
    ↓ (transcripts)
[useSubtitleQueue] ← manages text accumulation, debouncing, translation triggering
    ↓ (subtitle + translation)
[useOverlayWindow] ← syncs to overlay display
    ↓
[Picture-in-Picture or Popup Window]
```

Key hooks:
- **useSpeechRecognition**: Abstracts STT mode selection and audio device handling
- **useWhisper**: Manages Whisper model lifecycle, audio processing, segmentation
- **useSubtitleQueue**: Handles text accumulation, phrase detection (1s silence = new phrase), translation coordination
- **useOverlayWindow**: Manages both Picture-in-Picture and popup overlay modes
- **useAudioDevices**: Enumerates and manages microphone selection
- **useTranslation**: Translation API orchestration (delegates to service layer)

### Translation Service Architecture

Clean service architecture with factory pattern:

```
[src/services/translation/]
├── ITranslationService.ts          # Interface contract
├── TranslationServiceFactory.ts    # Singleton factory (supports: gemini, mock)
└── providers/
    ├── TranslationService.ts       # Generic API provider (currently: Gemini)
    └── MockTranslationService.ts   # Development mock
```

Translation happens server-side via Next.js API route [src/app/api/translate/route.ts](src/app/api/translate/route.ts):
- Uses Google Gemini AI for natural, context-aware translations
- Auto-detects language using `franc` library
- Auto-swaps source/target if detection conflicts with user selection (e.g., user selected Spanish→English but speaks English)
- Supports context accumulation for better translation accuracy

### Overlay Modes

Two presentation modes via [src/hooks/useOverlayWindow.ts](src/hooks/useOverlayWindow.ts):

1. **Picture-in-Picture** (preferred):
   - Uses Document Picture-in-Picture API
   - Renders subtitles on HTML5 canvas
   - Always-on-top floating window
   - Fallback to popup if PiP unavailable

2. **Popup Window**:
   - Traditional `window.open()` approach
   - Loads `/public/overlay.html` template
   - Updates via DOM manipulation

Both modes synchronize in real-time with main window subtitle updates.

## Directory Structure

```
src/
├── app/
│   ├── api/translate/route.ts   # Server-side translation API
│   ├── layout.tsx               # Root layout with React Query provider
│   ├── page.tsx                 # Main app (orchestrates all hooks)
│   └── globals.css              # Global styles
├── components/                  # UI components (LanguageSettings, SubtitlePreview, etc.)
├── hooks/                       # Custom React hooks (core business logic)
├── services/translation/        # Translation service layer
├── stores/                      # Zustand global state
├── workers/                     # Web Workers (Whisper inference)
├── utils/                       # Utilities (language detection, sentence detection, timing)
├── data/                        # Static data (language configs)
└── types/                       # TypeScript type definitions
```

## Environment Variables

Server-side environment variables (not prefixed with `NEXT_PUBLIC_`):

```env
GEMINI_API_KEY=your_gemini_api_key
```

Note: API keys are server-side only (accessed via `/api/translate` route), not exposed to client.

## Browser Compatibility

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| Whisper Mode | ✅ | ✅ | ✅ |
| Native STT | ✅ | ❌ | ❌ |
| Picture-in-Picture | ✅ | ❌ | ❌ |
| Popup Overlay | ✅ | ✅ | ✅ |

**Recommended**: Chrome or Edge for full feature support.

## Key Implementation Details

### Audio Processing Pipeline (Whisper Mode)

1. Capture microphone via `getUserMedia()` with selected device
2. Create `AudioContext` at 16kHz (Whisper's native sample rate)
3. Use `ScriptProcessorNode` to process 4096-sample chunks
4. Calculate RMS to detect silence
5. Accumulate audio until:
   - Silence > 500ms (natural pause), OR
   - Duration > 5s (max segment length)
6. Send Float32Array to Web Worker for Whisper inference
7. Worker returns transcript, trigger translation

### Subtitle Queueing & Translation Flow

1. Transcript arrives (interim or final) → `useSubtitleQueue.processNewText()`
2. Check if 1s elapsed since last text (new phrase detection)
3. If new phrase: clear context, reset display
4. Otherwise: append to context accumulator
5. Update display subtitle immediately
6. Debounce translation by 200ms
7. Translation completes → update display + sync to overlay

### Client-Side Hydration

All browser API usage wrapped with `useClientOnly()` hook to prevent SSR hydration mismatches.

## Known Constraints

- Whisper model download (~50-100MB) on first use
- Translation requires internet connection (API-based)
- Picture-in-Picture limited to Chromium browsers
- Audio device selection requires HTTPS or localhost
