<div align="center">

# 🎙️ EchoCast

**Real-time translated subtitles for your presentations**

Speak in your native language and display automatically translated subtitles

<br>

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)

</div>

---

## ✨ Features

🎤 **Dual speech recognition** - Web Speech API or offline AI (Whisper)
🌍 **Continuous automatic translation** while you speak
🖥️ **Picture-in-Picture overlay** for always-on-top subtitles
🔌 **AI-powered translation** with Google Gemini
⚡ **Works offline** - local Whisper AI + cached translations
🎯 **Auto language detection** and smart source/target swapping

## 🚀 Quick Start

```bash
# Install
npm install

# Configure (optional)
cp .env.example .env.local

# Run
npm run dev
```

Open [localhost:3000](http://localhost:3000) in Chrome or Edge

## 🎯 Usage

1. **Select languages** (source and target)
2. **Start recording** and allow microphone access
3. **Speak normally** - see transcription + translation
4. **Enable presentation mode** for floating overlay window

## 🔧 Translation

| Provider | Requires API Key | Features |
|----------|-----------------|----------|
| **Gemini** | ✅ | Google's latest AI, context-aware, natural translations |
| **Mock** | ❌ | Basic dictionary, ideal for development |

Configure in `.env.local` (server-side only):

```env
GEMINI_API_KEY=your_api_key
```

## 🌐 Browser Compatibility

| Browser | Native STT | Whisper Mode | Picture-in-Picture | Status |
|---------|-----------|--------------|-------------------|--------|
| Chrome | ✅ | ✅ | ✅ | Fully supported |
| Edge | ✅ | ✅ | ✅ | Fully supported |
| Firefox | ❌ | ✅ | ❌ | Use Whisper + Popup |
| Safari | ❌ | ✅ | ❌ | Use Whisper + Popup |

**Recommended**: Chrome or Edge for full feature support including Picture-in-Picture overlay.

## 📦 Commands

```bash
npm run dev      # Development with Turbopack
npm run build    # Production build
npm start        # Production server
npm run lint     # Linter
```

## 🚢 Deploy

### Vercel
```bash
npm run build && npx vercel
```

### Docker
```bash
docker build -t echocast .
docker run -p 3000:3000 echocast
```

## 💡 Use Cases

- 🌍 Multilingual conferences
- 📚 International online classes
- 💼 Meetings with global teams
- 🎤 Webinars with diverse audiences
- 🎯 Cross-border sales presentations

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand with devtools
- **Data Fetching**: TanStack Query (React Query)
- **STT**: Web Speech API + Whisper (via @xenova/transformers)
- **Translation**: Google Gemini AI
- **Language Detection**: franc library

## ⚠️ Notes

- **Native STT mode** requires internet connection (Web Speech API)
- **Whisper mode** works offline after initial model download (~50-100MB)
- **Translation** requires internet connection (API-based)
- Use **F11** in overlay window for borderless fullscreen mode
- Accuracy depends on **microphone quality** and accent
- Requires **HTTPS or localhost** for microphone access

## 📄 License

MIT License

---

<div align="center">

**Find it useful?** ⭐ Leave a star

</div>
