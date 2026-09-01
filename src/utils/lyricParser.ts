/**
 * Smart Lyric Parser & Slide Formatter for Church & Live Broadcast Presentations
 */

export interface ParsedSongSlides {
  title: string;
  artist: string;
  slides: string[];
  rawCleaned: string;
}

export function parseLyricsToSlides(
  rawLyrics: string,
  splitMode: 'stanzas' | 'lines' | 'smart' = 'smart',
  maxLinesPerSlide = 3
): string[] {
  if (!rawLyrics || !rawLyrics.trim()) return ['(No lyrics available)'];

  // 1. Remove LRC time tags like [00:12.34] or [01:23]
  let cleaned = rawLyrics.replace(/\[\d+:\d+(?:\.\d+)?\]\s*/g, '');

  // 2. Remove chord brackets like [G], [Am7], [C#m]
  cleaned = cleaned.replace(/\[[A-G][b#]?(?:m|maj|min|dim|aug|sus)?[0-9]?(?:\/[A-G][b#]?)?\]/g, '');

  // 3. Remove metadata headers if present like [ti:...], [ar:...]
  cleaned = cleaned.replace(/^\[[a-z]+:.*?\]$/gim, '');

  // 4. Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  if (splitMode === 'lines') {
    return cleaned
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
  }

  // Split by stanzas (empty lines or section labels)
  const rawBlocks = cleaned.split(/\n\s*\n+/);
  const slides: string[] = [];

  for (const block of rawBlocks) {
    const lines = block
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;

    if (splitMode === 'stanzas' || lines.length <= maxLinesPerSlide) {
      // Keep entire stanza as one slide if short enough
      slides.push(lines.join('\n'));
    } else {
      // Chunk long stanzas into 2-3 lines per slide
      for (let i = 0; i < lines.length; i += maxLinesPerSlide) {
        const chunk = lines.slice(i, i + maxLinesPerSlide);
        slides.push(chunk.join('\n'));
      }
    }
  }

  return slides.length > 0 ? slides : [cleaned];
}
