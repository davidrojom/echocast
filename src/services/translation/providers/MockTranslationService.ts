import { ITranslationService } from '../ITranslationService';
import mockTranslationsData from '../../../data/mockTranslations.json';

type MockTranslations = {
  [key: string]: {
    [lang: string]: string;
  };
};

const mockTranslations: MockTranslations = mockTranslationsData;

export class MockTranslationService implements ITranslationService {
  public readonly name = 'Mock Translation';

  async translate(text: string, source: string, target: string, context?: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("Mock translation called:", { text, source, target });

    const lowerText = text.toLowerCase().trim();

    const isSpanishToEnglish = source.startsWith("es") && target.startsWith("en");
    const isEnglishToSpanish = source.startsWith("en") && target.startsWith("es");

    if (mockTranslations[lowerText]) {
      const targetLangCode = target.split('-')[0];
      if (mockTranslations[lowerText][targetLangCode]) {
        return mockTranslations[lowerText][targetLangCode];
      }
    }

    for (const [sourceWord, translations] of Object.entries(mockTranslations)) {
      if (lowerText.includes(sourceWord) || sourceWord.includes(lowerText)) {
        const targetLangCode = target.split('-')[0];
        if (translations[targetLangCode]) {
          return translations[targetLangCode];
        }
      }
    }

    if (isSpanishToEnglish) {
      return `[EN] ${text}`;
    } else if (isEnglishToSpanish) {
      return `[ES] ${text}`;
    } else {
      const hasSpanishChars = /[ñáéíóúü]/i.test(text);
      const commonSpanishWords =
        /\b(el|la|los|las|de|en|con|por|para|que|es|está|son|del|al)\b/i.test(
          text
        );
      const commonEnglishWords =
        /\b(the|and|or|of|in|to|for|with|is|are|was|were|this|that)\b/i.test(
          text
        );

      if (hasSpanishChars || (commonSpanishWords && !commonEnglishWords)) {
        return `[EN] ${text}`;
      } else {
        return `[ES] ${text}`;
      }
    }
  }
}
