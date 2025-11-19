import { ITranslationService } from "./ITranslationService";
import { TranslationService } from "./providers/TranslationService";
import { MockTranslationService } from "./providers/MockTranslationService";

export type TranslationProvider = "gemini" | "mock";

export class TranslationServiceFactory {
  private static instance: TranslationServiceFactory;
  private readonly services: Map<TranslationProvider, ITranslationService>;

  private constructor() {
    this.services = new Map();
  }

  public static getInstance(): TranslationServiceFactory {
    if (!TranslationServiceFactory.instance) {
      TranslationServiceFactory.instance = new TranslationServiceFactory();
    }
    return TranslationServiceFactory.instance;
  }

  public getService(provider: TranslationProvider): ITranslationService {
    if (!this.services.has(provider)) {
      this.services.set(provider, this.createService(provider));
    }
    return this.services.get(provider)!;
  }

  private createService(provider: TranslationProvider): ITranslationService {
    switch (provider) {
      case "gemini":
        return new TranslationService("Gemini", "gemini");
      case "mock":
      default:
        return new MockTranslationService();
    }
  }
}
