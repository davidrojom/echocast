export function isCompleteSentence(text: string): boolean {
  const trimmed = text.trim();

  if (!/[.!?]$/.test(trimmed)) {
    return false;
  }

  const words = trimmed.split(" ").filter((w) => w.length > 0);
  return words.length >= 3;
}

export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function getLastCompleteSentence(text: string): string | null {
  const sentences = splitIntoSentences(text);
  return sentences.length > 0 ? sentences[sentences.length - 1] : null;
}
