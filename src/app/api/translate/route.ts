import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { franc } from "franc";

export async function POST(req: NextRequest) {
  try {
    const {
      text,
      source,
      target,
      context,
      provider = "gemini",
    } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    let translatedText = "";

    switch (provider) {
      case "gemini":
        translatedText = await translateWithGemini(
          text,
          source,
          target,
          context,
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid provider" },
          { status: 400 },
        );
    }

    return NextResponse.json({ translatedText });
  } catch (error: unknown) {
    console.error("Translation API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function detectLanguage(text: string): Promise<string | null> {
  if (!text || text.trim().length < 10) return null;
  try {
    const langCode = franc(text, { minLength: 10 });
    if (langCode === "und") return null;
    return convertToISO6391(langCode);
  } catch (e) {
    console.error("Language detection error:", e);
    return null;
  }
}

function convertToISO6391(iso639_3: string): string {
  const mapping: Record<string, string> = {
    eng: "en",
    spa: "es",
    fra: "fr",
    deu: "de",
    ita: "it",
    por: "pt",
    rus: "ru",
    jpn: "ja",
    zho: "zh",
    kor: "ko",
    ara: "ar",
    hin: "hi",
    nld: "nl",
    tur: "tr",
    pol: "pl",
    swe: "sv",
    fin: "fi",
    dan: "da",
    ces: "cs",
    ell: "el",
    hun: "hu",
    ron: "ro",
    tha: "th",
    vie: "vi",
    ind: "id",
    msa: "ms",
    heb: "he",
    ukr: "uk",
  };
  return mapping[iso639_3] || iso639_3.slice(0, 2);
}

async function resolveLanguages(text: string, source: string, target: string) {
  const detected = await detectLanguage(text);
  let actualSource =
    source === "auto" ? detected || "en" : source.split("-")[0];
  let actualTarget = target.split("-")[0];

  if (detected && source !== "auto") {
    if (detected === "en" && actualSource === "es") {
      actualSource = "en";
      actualTarget = "es";
    } else if (detected === "es" && actualSource === "en") {
      actualSource = "es";
      actualTarget = "en";
    }
  }
  return { actualSource, actualTarget, detected };
}

async function translateWithGemini(
  text: string,
  source: string,
  target: string,
  context?: string,
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const { actualSource } = await resolveLanguages(text, source, target);
  const sourceLang =
    source === "auto" ? `detected language (${actualSource})` : source;

  let prompt = `You are a professional translator. Translate the following text from ${sourceLang} to ${target}.
  
Text to translate:
"${text}"
`;

  if (context) {
    prompt += `
Context for the translation (use this to resolve ambiguities and ensure correct meaning):
"${context}"
`;
  }

  prompt += `
Return ONLY the translated text. Do not include any explanations, notes, or quotes around the output.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}
