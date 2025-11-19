export interface ITranslationService {
  /**
   * Translates text from source language to target language.
   * @param text The text to translate
   * @param source The source language code (ISO 639-1)
   * @param target The target language code (ISO 639-1)
   * @param context Optional previous context to aid translation
   * @returns The translated text
   */
  translate(text: string, source: string, target: string, context?: string): Promise<string>;

  /**
   * The name of the translation provider.
   */
  name: string;
}
