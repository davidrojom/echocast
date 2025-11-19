import { ITranslationService } from '../ITranslationService';

export class TranslationService implements ITranslationService {
  public readonly name: string;
  private readonly provider: string;

  constructor(name: string, provider: string) {
    this.name = name;
    this.provider = provider;
  }

  async translate(text: string, source: string, target: string, context?: string): Promise<string> {

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          source,
          target,
          context,
          provider: this.provider
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation request failed');
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      throw error;
    }
  }
}
