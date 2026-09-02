import { LibraryItem } from '../types';

export interface PopularWorshipSong {
  title: string;
  artist: string;
  tags?: string[];
}

export interface LyricSuggestion {
  text: string;
  title: string;
  artist: string;
  isLocal: boolean;
  localItem?: LibraryItem;
  label: string;
  subLabel: string;
  badge: string;
}

export const POPULAR_WORSHIP_SONGS: PopularWorshipSong[] = [
  { title: 'Goodness of God', artist: 'Bethel Music / CeCe Winans', tags: ['faithfulness', 'praise'] },
  { title: 'Way Maker', artist: 'Sinach / Leeland / Michael W. Smith', tags: ['miracles', 'promise keeper'] },
  { title: '10,000 Reasons (Bless the Lord)', artist: 'Matt Redman', tags: ['bless the lord', 'praise'] },
  { title: 'What a Beautiful Name', artist: 'Hillsong Worship', tags: ['jesus', 'name above all names'] },
  { title: 'Oceans (Where Feet May Fail)', artist: 'Hillsong UNITED', tags: ['faith', 'trust'] },
  { title: 'King of Kings', artist: 'Hillsong Worship', tags: ['gospel', 'resurrection'] },
  { title: 'Great Are You Lord', artist: 'All Sons & Daughters', tags: ['breath', 'praise'] },
  { title: 'Build My Life', artist: 'Pat Barrett / Housefires', tags: ['foundation', 'holy'] },
  { title: 'Living Hope', artist: 'Phil Wickham', tags: ['cross', 'salvation'] },
  { title: 'Gratitude', artist: 'Brandon Lake', tags: ['thankfulness', 'praise'] },
  { title: 'Holy Forever', artist: 'Chris Tomlin', tags: ['angels', 'holy'] },
  { title: 'Reckless Love', artist: 'Cory Asbury', tags: ['love of god', 'pursuit'] },
  { title: 'Cornerstone', artist: 'Hillsong Worship', tags: ['christ alone', 'solid rock'] },
  { title: 'In Christ Alone', artist: 'Keith & Kristyn Getty / Stuart Townend', tags: ['hymn', 'solid ground'] },
  { title: 'Lord I Need You', artist: 'Matt Maher', tags: ['every hour', 'grace'] },
  { title: 'Amazing Grace', artist: 'John Newton / Traditional', tags: ['hymn', 'grace'] },
  { title: 'How Great Thou Art', artist: 'Stuart K. Hine / Traditional', tags: ['hymn', 'creation'] },
  { title: 'Great Is Thy Faithfulness', artist: 'Thomas Chisholm / Traditional', tags: ['hymn', 'faithfulness'] },
  { title: 'The Blessing', artist: 'Kari Jobe / Cody Carnes / Elevation Worship', tags: ['blessing', 'peace'] },
  { title: 'Graves Into Gardens', artist: 'Elevation Worship / Brandon Lake', tags: ['resurrection', 'joy'] },
  { title: 'Firm Foundation (He Won\'t)', artist: 'Cody Carnes / Maverick City Music', tags: ['solid rock', 'trust'] },
  { title: 'Trust in God', artist: 'Elevation Worship', tags: ['blessed assurance', 'trust'] },
  { title: 'Praise', artist: 'Elevation Worship / Brandon Lake', tags: ['praise the lord', 'joy'] },
  { title: 'Lion and the Lamb', artist: 'Bethel Music / Leeland', tags: ['glory', 'power'] },
  { title: 'This Is Amazing Grace', artist: 'Phil Wickham', tags: ['king of glory', 'cross'] },
  { title: 'Who You Say I Am', artist: 'Hillsong Worship', tags: ['child of god', 'freedom'] },
  { title: 'See a Victory', artist: 'Elevation Worship', tags: ['battle', 'victory'] },
  { title: 'Do It Again', artist: 'Elevation Worship', tags: ['faithfulness', 'promise'] },
  { title: 'Here I Am to Worship', artist: 'Tim Hughes', tags: ['light of the world', 'humble'] },
  { title: 'Mighty to Save', artist: 'Hillsong Worship', tags: ['compassion', 'salvation'] },
  { title: 'Revelation Song', artist: 'Kari Jobe / Gateway Worship', tags: ['worthy', 'holy'] },
  { title: 'Blessed Assurance', artist: 'Fanny Crosby / Traditional', tags: ['hymn', 'praise'] },
  { title: 'It Is Well With My Soul', artist: 'Horatio Spafford / Traditional', tags: ['hymn', 'peace'] },
  { title: 'Because He Lives', artist: 'Bill & Gloria Gaither', tags: ['hymn', 'resurrection'] },
  { title: 'Crown Him with Many Crowns', artist: 'Matthew Bridges / Traditional', tags: ['hymn', 'worship'] },
  { title: 'Holy, Holy, Holy', artist: 'Reginald Heber / Traditional', tags: ['hymn', 'trinity'] },
  { title: 'Victory in Jesus', artist: 'E.M. Bartlett / Traditional', tags: ['hymn', 'redemption'] },
  { title: 'I Speak Jesus', artist: 'Charity Gayle', tags: ['healing', 'jesus'] },
  { title: 'Thank You Jesus for the Blood', artist: 'Charity Gayle', tags: ['cross', 'cleansing'] },
  { title: 'Worthy Is the Lamb', artist: 'Hillsong Worship', tags: ['cross', 'throne'] },
];

/**
 * Generate lyric autocomplete suggestions.
 * CRITICAL RULE: Locally saved items in `libraryItems` are checked first and prioritized at the top!
 */
export function getLyricSuggestions(
  query: string,
  libraryItems: LibraryItem[] = []
): LyricSuggestion[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();
  const results: LyricSuggestion[] = [];
  const seenTitles = new Set<string>();

  // --- 1. LOCAL LIBRARY FIRST: Check already saved songs & hymns ---
  const localMatches = libraryItems.filter(item => {
    // Only match songs/hymns/custom items, or scriptures if user queries them
    const isSongLike = item.category === 'song' || item.category === 'hymn' || item.category === 'custom';
    if (!isSongLike) return false;

    const titleMatch = item.title.toLowerCase().includes(lower);
    const authorMatch = item.author ? item.author.toLowerCase().includes(lower) : false;
    const contentMatch = item.content ? item.content.toLowerCase().includes(lower) : false;

    return titleMatch || authorMatch || contentMatch;
  });

  // Sort local matches: exact title start first
  localMatches.sort((a, b) => {
    const aStarts = a.title.toLowerCase().startsWith(lower);
    const bStarts = b.title.toLowerCase().startsWith(lower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return b.updatedAt - a.updatedAt;
  });

  for (const item of localMatches) {
    const normalizedKey = item.title.toLowerCase();
    if (!seenTitles.has(normalizedKey)) {
      seenTitles.add(normalizedKey);
      results.push({
        text: item.title,
        title: item.title,
        artist: item.author || 'Local Library',
        isLocal: true,
        localItem: item,
        label: item.title,
        subLabel: `${item.author ? `by ${item.author} • ` : ''}${item.lines?.length || 0} Slides Saved`,
        badge: 'Saved Locally',
      });
    }
  }

  // --- 2. ONLINE / POPULAR WORSHIP CATALOG ---
  const popularMatches = POPULAR_WORSHIP_SONGS.filter(song => {
    const titleMatch = song.title.toLowerCase().includes(lower);
    const artistMatch = song.artist.toLowerCase().includes(lower);
    const tagMatch = song.tags ? song.tags.some(t => t.toLowerCase().includes(lower)) : false;
    return titleMatch || artistMatch || tagMatch;
  });

  // Sort popular matches: title starts with query first
  popularMatches.sort((a, b) => {
    const aStarts = a.title.toLowerCase().startsWith(lower);
    const bStarts = b.title.toLowerCase().startsWith(lower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });

  for (const song of popularMatches) {
    const normalizedKey = song.title.toLowerCase();
    if (!seenTitles.has(normalizedKey)) {
      seenTitles.add(normalizedKey);
      results.push({
        text: song.title,
        title: song.title,
        artist: song.artist,
        isLocal: false,
        label: song.title,
        subLabel: `by ${song.artist}`,
        badge: 'Popular',
      });
    }
  }

  return results.slice(0, 8);
}
