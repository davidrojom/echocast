
export function calculateDisplayTime(text: string): number {

  const isLongSubtitle = text.length > 80;


  const baseTime = isLongSubtitle ? 2000 : 1500;


  const readingTime = Math.min(
    text.length * 45,
    isLongSubtitle ? 6000 : 4000
  );

  return Math.max(baseTime, readingTime);
}


export function shouldDisplayImmediately(text: string): boolean {
  const words = text.split(' ').filter(w => w.length > 0).length;
  const isSentenceEnd = /[.!?]$/.test(text.trim());
  return words >= 5 && isSentenceEnd;
}
