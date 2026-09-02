import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Globe, 
  Music, 
  Play, 
  ListPlus, 
  Check, 
  X, 
  Loader2, 
  BookCheck, 
  BookOpen,
  ChevronRight,
  BookMarked,
  Info,
  CheckCheck,
  HardDrive
} from 'lucide-react';
import { LibraryItem } from '../types';
import { parseLyricsToSlides } from '../utils/lyricParser';
import { getBibleSuggestions, BibleSuggestion } from '../data/bibleBooks';
import { getLyricSuggestions, LyricSuggestion } from '../data/popularWorshipSongs';

interface OnlineSongResult {
  id: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  snippet?: string;
  plainLyrics: string;
  isLocal?: boolean;
  localItem?: LibraryItem;
}

interface OnlineScriptureVerse {
  verse: number;
  text: string;
}

interface OnlineScriptureResult {
  reference: string;
  version: string;
  versionName: string;
  verses: OnlineScriptureVerse[];
  plainContent: string;
  totalVerses: number;
}

const AVAILABLE_BIBLE_VERSIONS = [
  { id: 'KJV', name: 'King James Version', category: 'Classic' },
  { id: 'NKJV', name: 'New King James Version', category: 'Modern' },
  { id: 'NIV', name: 'New International Version', category: 'Modern' },
  { id: 'ESV', name: 'English Standard Version', category: 'Modern' },
  { id: 'NLT', name: 'New Living Translation', category: 'Modern' },
  { id: 'NASB', name: 'New American Standard', category: 'Modern' },
  { id: 'WEB', name: 'World English Bible', category: 'Public' },
  { id: 'ASV', name: 'American Standard Version', category: 'Classic' },
  { id: 'AMP', name: 'Amplified Bible', category: 'Study' },
  { id: 'RSV', name: 'Revised Standard Version', category: 'Classic' },
  { id: 'MSG', name: 'The Message', category: 'Paraphrase' },
  { id: 'BBE', name: 'Bible in Basic English', category: 'Basic' },
  { id: 'DARBY', name: 'Darby Bible', category: 'Classic' },
  { id: 'DRA', name: 'Douay-Rheims', category: 'Catholic' },
  { id: 'YLT', name: "Young's Literal Translation", category: 'Literal' },
];

const POPULAR_SCRIPTURES = [
  { label: 'John 3:16-17', query: 'John 3:16-17' },
  { label: 'Psalm 23:1-6', query: 'Psalm 23:1-6' },
  { label: 'Romans 8:28-31', query: 'Romans 8:28-31' },
  { label: 'Philippians 4:6-8', query: 'Philippians 4:6-8' },
  { label: '1 Cor 13:4-8', query: '1 Cor 13:4-8' },
  { label: 'Isaiah 40:29-31', query: 'Isaiah 40:29-31' },
  { label: 'Proverbs 3:5-6', query: 'Proverbs 3:5-6' },
];

interface OnlineLyricsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  library?: LibraryItem[];
  onSaveLibraryItem: (item: LibraryItem) => void;
  onAddToSchedule: (item: LibraryItem) => void;
  onGoLiveWithItem: (item: LibraryItem) => void;
  initialTab?: 'lyrics' | 'scripture';
}

export const OnlineLyricsSearchModal: React.FC<OnlineLyricsSearchModalProps> = ({
  isOpen,
  onClose,
  library = [],
  onSaveLibraryItem,
  onAddToSchedule,
  onGoLiveWithItem,
  initialTab = 'scripture',
}) => {
  // Modal active mode tab
  const [activeTab, setActiveTab] = useState<'lyrics' | 'scripture'>(initialTab);

  // --- Lyrics Search State ---
  const [lyricsQuery, setLyricsQuery] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [onlineSongResults, setOnlineSongResults] = useState<OnlineSongResult[]>([]);
  const [selectedSong, setSelectedSong] = useState<OnlineSongResult | null>(null);
  const [lyricsSplitMode, setLyricsSplitMode] = useState<'smart' | 'stanzas' | 'lines'>('smart');
  const [lyricsSavedFeedback, setLyricsSavedFeedback] = useState<string | null>(null);
  const [lyricsLiveFeedback, setLyricsLiveFeedback] = useState(false);
  const [lyricsScheduleFeedback, setLyricsScheduleFeedback] = useState(false);

  // Lyric Autocomplete State
  const [showLyricSuggestions, setShowLyricSuggestions] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const lyricInputRef = useRef<HTMLInputElement | null>(null);

  // --- Scripture Search State ---
  const [scriptureQuery, setScriptureQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('KJV');
  const [scriptureLoading, setScriptureLoading] = useState(false);
  const [scriptureResult, setScriptureResult] = useState<OnlineScriptureResult | null>(null);
  const [scriptureError, setScriptureError] = useState<string | null>(null);
  const [scriptureSplitMode, setScriptureSplitMode] = useState<'verse' | 'double' | 'full'>('verse');
  const [includeReferenceOnSlide, setIncludeReferenceOnSlide] = useState(true);
  const [scriptureSavedFeedback, setScriptureSavedFeedback] = useState<string | null>(null);
  const [scriptureLiveFeedback, setScriptureLiveFeedback] = useState(false);
  const [scriptureScheduleFeedback, setScriptureScheduleFeedback] = useState(false);

  // Scripture Autocomplete State
  const [showScriptureSuggestions, setShowScriptureSuggestions] = useState(false);
  const [activeScriptureIndex, setActiveScriptureIndex] = useState(-1);
  const scriptureInputRef = useRef<HTMLInputElement | null>(null);
  const versionListRef = useRef<HTMLDivElement | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectVersion = (verId: string) => {
    setSelectedVersion(verId);
    if (hasScriptureChapter(scriptureQuery)) {
      executeScriptureSearch(scriptureQuery, verId);
    }
  };

  const handleVersionKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = AVAILABLE_BIBLE_VERSIONS.findIndex(v => v.id === selectedVersion);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < AVAILABLE_BIBLE_VERSIONS.length - 1 ? currentIndex + 1 : 0;
      handleSelectVersion(AVAILABLE_BIBLE_VERSIONS[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : AVAILABLE_BIBLE_VERSIONS.length - 1;
      handleSelectVersion(AVAILABLE_BIBLE_VERSIONS[prevIndex].id);
    }
  };

  // Automatically scroll active version into view
  useEffect(() => {
    const el = document.getElementById(`bible-version-item-${selectedVersion}`);
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedVersion]);

  // --- 1. LOCAL-FIRST MATCHES FOR SONGS ---
  // Matches from church's local library are checked first!
  const localSongMatches: OnlineSongResult[] = React.useMemo(() => {
    const q = lyricsQuery.trim().toLowerCase();
    if (!q) return [];

    return (library || [])
      .filter(item => {
        const isSongLike = item.category === 'song' || item.category === 'hymn' || item.category === 'custom';
        if (!isSongLike) return false;
        return (
          item.title.toLowerCase().includes(q) ||
          (item.author && item.author.toLowerCase().includes(q)) ||
          (item.content && item.content.toLowerCase().includes(q))
        );
      })
      .map(item => ({
        id: item.id,
        trackName: item.title,
        artistName: item.author || 'Local Church Library',
        snippet: item.lines?.slice(0, 2).join(' • ') || '',
        plainLyrics: item.content || item.lines?.join('\n') || '',
        isLocal: true,
        localItem: item,
      }));
  }, [library, lyricsQuery]);

  // Combined song results: local first, then online
  const combinedSongResults = React.useMemo(() => {
    // Avoid duplicates if local matches title of online
    const localTitles = new Set(localSongMatches.map(m => m.trackName.toLowerCase()));
    const filteredOnline = onlineSongResults.filter(
      online => !localTitles.has(online.trackName.toLowerCase())
    );
    return [...localSongMatches, ...filteredOnline];
  }, [localSongMatches, onlineSongResults]);

  // Autocomplete Suggestions for Song Lyrics
  const lyricSuggestions: LyricSuggestion[] = React.useMemo(() => {
    if (!lyricsQuery.trim() || !showLyricSuggestions) return [];
    return getLyricSuggestions(lyricsQuery, library);
  }, [lyricsQuery, showLyricSuggestions, library]);

  // Autocomplete Suggestions for Scripture
  const scriptureSuggestions: BibleSuggestion[] = React.useMemo(() => {
    if (!scriptureQuery.trim() || !showScriptureSuggestions) return [];
    return getBibleSuggestions(scriptureQuery, selectedVersion);
  }, [scriptureQuery, showScriptureSuggestions, selectedVersion]);

  // Debounced search for Lyrics
  useEffect(() => {
    if (activeTab !== 'lyrics') return;

    if (!lyricsQuery.trim()) {
      setOnlineSongResults([]);
      setSelectedSong(null);
      setLyricsLoading(false);
      return;
    }

    // Auto-select local match first if available
    if (localSongMatches.length > 0 && !selectedSong) {
      setSelectedSong(localSongMatches[0]);
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setLyricsLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/lyrics/search?q=${encodeURIComponent(lyricsQuery.trim())}`);
        const data = await res.json();
        const songs: OnlineSongResult[] = (data.results || []).map((s: OnlineSongResult) => ({
          ...s,
          isLocal: false,
        }));
        setOnlineSongResults(songs);
        
        // If nothing selected yet, select the first match (local first, then online)
        if (!selectedSong) {
          if (localSongMatches.length > 0) {
            setSelectedSong(localSongMatches[0]);
          } else if (songs.length > 0) {
            handleSelectSong(songs[0]);
          }
        }
      } catch (err) {
        console.error('Failed to search lyrics:', err);
      } finally {
        setLyricsLoading(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [lyricsQuery, activeTab, localSongMatches.length]);

  // Helper: Only trigger online scripture lookup when a chapter number is provided
  const hasScriptureChapter = (query: string): boolean => {
    const trimmed = query.trim();
    if (!trimmed) return false;

    // Remove trailing version codes e.g. "KJV", "NIV", etc.
    const versionCodes = AVAILABLE_BIBLE_VERSIONS.map(v => v.id);
    const versionRegex = new RegExp(`[\\s,\\(-]+(${versionCodes.join('|')})[\\)\\s]*$`, 'i');
    const cleaned = trimmed.replace(versionRegex, '').trim();

    // Strip leading book number if book is like "1 John", "2 Samuel", "1 Cor"
    const strippedLeadingNum = cleaned.replace(/^[1-3]\s*[a-zA-Z]+/i, '');

    // Must contain a number for chapter
    return /\d+/.test(strippedLeadingNum);
  };

  // Execute Scripture search
  const executeScriptureSearch = async (queryText: string, versionOverride?: string) => {
    const raw = queryText.trim();
    setShowScriptureSuggestions(false);
    if (!raw) {
      setScriptureResult(null);
      setScriptureError(null);
      setScriptureLoading(false);
      return;
    }

    // Do not search online until the chapter number is added!
    if (!hasScriptureChapter(raw)) {
      setScriptureLoading(false);
      setScriptureResult(null);
      setScriptureError(`Please add a chapter number to search online (e.g. "${raw} 1" or "${raw} 3:16").`);
      setShowScriptureSuggestions(true);
      return;
    }

    // Check if query contains an embedded Bible version (e.g. "john 2:30 KJV", "romans 8:28 NIV")
    const versionCodes = AVAILABLE_BIBLE_VERSIONS.map(v => v.id);
    const versionRegex = new RegExp(`[\\s,\\(-]+(${versionCodes.join('|')})[\\)\\s]*$`, 'i');
    const match = raw.match(versionRegex);

    let activeVersion = versionOverride || selectedVersion;
    if (match) {
      const detected = match[1].toUpperCase();
      activeVersion = detected;
      setSelectedVersion(detected); // Auto-sync dropdown!
    }

    setScriptureLoading(true);
    setScriptureError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(
        `${apiBase}/api/scripture/search?q=${encodeURIComponent(raw)}&version=${encodeURIComponent(activeVersion)}`
      );
      const data = await res.json();

      if (data.error) {
        setScriptureError(data.error);
        setScriptureResult(null);
      } else if (data.verses && data.verses.length > 0) {
        setScriptureResult(data);
        setScriptureError(null);
        // Automatically save to local persistent library
        const item = getLibraryItemFromScripture(data, scriptureSplitMode, includeReferenceOnSlide);
        onSaveLibraryItem(item);
        setScriptureSavedFeedback(`"${data.reference} (${data.version})" auto-saved to library!`);
      } else {
        setScriptureError(`No verses found for "${raw}".`);
        setScriptureResult(null);
      }
    } catch (err: any) {
      console.error('Scripture search error:', err);
      setScriptureError('Failed to connect to online scripture provider. Please check your network.');
      setScriptureResult(null);
    } finally {
      setScriptureLoading(false);
    }
  };

  // Debounced search for Scripture when typing
  useEffect(() => {
    if (activeTab !== 'scripture') return;

    if (!scriptureQuery.trim()) {
      setScriptureResult(null);
      setScriptureError(null);
      setScriptureLoading(false);
      return;
    }

    // DO NOT search online until the chapter number is added to the scripture query!
    if (!hasScriptureChapter(scriptureQuery)) {
      setScriptureLoading(false);
      setScriptureError(null);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      executeScriptureSearch(scriptureQuery, selectedVersion);
    }, 450);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [scriptureQuery, selectedVersion, activeTab]);

  if (!isOpen) return null;

  // --- Helper: Format Scripture into Presentation Slides ---
  const formatScriptureSlides = (
    result: OnlineScriptureResult | null,
    mode = scriptureSplitMode,
    withRefBadge = includeReferenceOnSlide
  ): string[] => {
    if (!result || !result.verses || result.verses.length === 0) return [];

    const bookAndChapter = result.reference.includes(':')
      ? result.reference.split(':')[0]
      : result.reference;

    if (mode === 'full') {
      const passage = result.verses.map(v => `${v.verse} ${v.text}`).join(' ');
      const header = withRefBadge ? `${result.reference} (${result.version})\n` : '';
      return [`${header}${passage}`];
    }

    if (mode === 'double') {
      const slides: string[] = [];
      for (let i = 0; i < result.verses.length; i += 2) {
        const pair = result.verses.slice(i, i + 2);
        const header = withRefBadge
          ? `${bookAndChapter}:${pair[0].verse}${pair.length > 1 ? `-${pair[pair.length - 1].verse}` : ''} (${result.version})\n`
          : '';
        const body = pair.map(v => `${v.verse} ${v.text}`).join('\n\n');
        slides.push(`${header}${body}`);
      }
      return slides;
    }

    // Default: 1 verse per slide
    return result.verses.map(v => {
      const header = withRefBadge ? `${bookAndChapter}:${v.verse} (${result.version})\n` : '';
      return `${header}${v.text}`;
    });
  };

  // --- Convert Scripture result to LibraryItem ---
  const getLibraryItemFromScripture = (
    res: OnlineScriptureResult,
    mode = scriptureSplitMode,
    withRef = includeReferenceOnSlide
  ): LibraryItem => {
    const slides = formatScriptureSlides(res, mode, withRef);
    return {
      id: `scripture-${res.reference.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${res.version.toLowerCase()}-${Date.now().toString(36)}`,
      title: `${res.reference} (${res.version})`,
      author: res.versionName || `${res.version} Bible`,
      category: 'scripture',
      content: res.plainContent,
      lines: slides,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  // --- Convert Song result to LibraryItem ---
  const getLibraryItemFromSong = (song: OnlineSongResult, mode = lyricsSplitMode): LibraryItem => {
    if (song.isLocal && song.localItem) {
      // Return the existing local item directly
      return song.localItem;
    }
    const parsedSlides = parseLyricsToSlides(song.plainLyrics, mode);
    return {
      id: `song-${song.trackName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
      title: song.trackName,
      author: song.artistName,
      category: 'song',
      content: song.plainLyrics,
      lines: parsedSlides,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  // Handlers for Lyrics Selection
  const handleSelectSong = (song: OnlineSongResult) => {
    setSelectedSong(song);
    if (song.isLocal) {
      setLyricsSavedFeedback(`"${song.trackName}" loaded from your local library!`);
    } else {
      const item = getLibraryItemFromSong(song, lyricsSplitMode);
      onSaveLibraryItem(item);
      setLyricsSavedFeedback(`"${song.trackName}" auto-saved to local song library!`);
    }
  };

  const handleSelectLyricSuggestion = (s: LyricSuggestion) => {
    setLyricsQuery(s.title);
    setShowLyricSuggestions(false);
    if (s.isLocal && s.localItem) {
      const converted: OnlineSongResult = {
        id: s.localItem.id,
        trackName: s.localItem.title,
        artistName: s.localItem.author || 'Local Library',
        snippet: s.localItem.lines?.slice(0, 2).join(' • ') || '',
        plainLyrics: s.localItem.content || s.localItem.lines?.join('\n') || '',
        isLocal: true,
        localItem: s.localItem,
      };
      setSelectedSong(converted);
      setLyricsSavedFeedback(`"${s.localItem.title}" loaded from your local library!`);
    }
  };

  const handleGoLiveLyrics = () => {
    if (!selectedSong) return;
    const item = getLibraryItemFromSong(selectedSong, lyricsSplitMode);
    if (!selectedSong.isLocal) {
      onSaveLibraryItem(item);
    }
    onGoLiveWithItem(item);
    setLyricsLiveFeedback(true);
    setTimeout(() => {
      setLyricsLiveFeedback(false);
      onClose();
    }, 600);
  };

  const handleAddToScheduleLyrics = () => {
    if (!selectedSong) return;
    const item = getLibraryItemFromSong(selectedSong, lyricsSplitMode);
    if (!selectedSong.isLocal) {
      onSaveLibraryItem(item);
    }
    onAddToSchedule(item);
    setLyricsScheduleFeedback(true);
    setTimeout(() => setLyricsScheduleFeedback(false), 1500);
  };

  // Handlers for Scripture
  const handleSelectScriptureSuggestion = (s: BibleSuggestion) => {
    setScriptureQuery(s.text);
    setShowScriptureSuggestions(false);
    executeScriptureSearch(s.text, selectedVersion);
  };

  const handleGoLiveScripture = () => {
    if (!scriptureResult) return;
    const item = getLibraryItemFromScripture(scriptureResult, scriptureSplitMode, includeReferenceOnSlide);
    onSaveLibraryItem(item);
    onGoLiveWithItem(item);
    setScriptureLiveFeedback(true);
    setTimeout(() => {
      setScriptureLiveFeedback(false);
      onClose();
    }, 600);
  };

  const handleAddToScheduleScripture = () => {
    if (!scriptureResult) return;
    const item = getLibraryItemFromScripture(scriptureResult, scriptureSplitMode, includeReferenceOnSlide);
    onSaveLibraryItem(item);
    onAddToSchedule(item);
    setScriptureScheduleFeedback(true);
    setTimeout(() => setScriptureScheduleFeedback(false), 1500);
  };

  // Preview slides
  const scripturePreviewSlides = formatScriptureSlides(scriptureResult, scriptureSplitMode, includeReferenceOnSlide);
  const lyricsPreviewSlides = selectedSong 
    ? (selectedSong.isLocal && selectedSong.localItem?.lines?.length
        ? selectedSong.localItem.lines 
        : parseLyricsToSlides(selectedSong.plainLyrics, lyricsSplitMode))
    : [];

  return (
    <div className="modal-backdrop" onClick={() => {
      setShowScriptureSuggestions(false);
      setShowLyricSuggestions(false);
      onClose();
    }}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '1160px', height: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header with Mode Switcher */}
        <div className="modal-header" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: activeTab === 'scripture'
                ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: activeTab === 'scripture'
                ? '0 0 12px rgba(16, 185, 129, 0.35)'
                : '0 0 12px rgba(59, 130, 246, 0.35)',
              transition: 'all 0.2s ease'
            }}>
              {activeTab === 'scripture' ? (
                <BookOpen size={17} color="#ffffff" />
              ) : (
                <Music size={17} color="#ffffff" />
              )}
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Online Media & Scripture Search</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {activeTab === 'scripture'
                  ? 'Fast local Bible autocomplete & instant multi-version passage search'
                  : 'Checks your local library first, then searches online worship databases'}
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.45)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                className={`btn ${activeTab === 'scripture' ? 'btn-primary' : ''}`}
                style={{
                  fontSize: '12px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: activeTab === 'scripture' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  borderColor: activeTab === 'scripture' ? '#10b981' : 'transparent',
                  color: activeTab === 'scripture' ? '#ffffff' : '#94a3b8',
                  fontWeight: activeTab === 'scripture' ? 700 : 500,
                }}
                onClick={() => {
                  setActiveTab('scripture');
                  setShowLyricSuggestions(false);
                }}
              >
                <BookOpen size={14} />
                Holy Scripture
              </button>

              <button
                className={`btn ${activeTab === 'lyrics' ? 'btn-primary' : ''}`}
                style={{
                  fontSize: '12px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: activeTab === 'lyrics' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                  borderColor: activeTab === 'lyrics' ? '#3b82f6' : 'transparent',
                  color: activeTab === 'lyrics' ? '#ffffff' : '#94a3b8',
                  fontWeight: activeTab === 'lyrics' ? 700 : 500,
                }}
                onClick={() => {
                  setActiveTab('lyrics');
                  setShowScriptureSuggestions(false);
                }}
              >
                <Music size={14} />
                Song Lyrics
              </button>
            </div>

            <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ---------------- SCRIPTURE TAB ---------------- */}
        {activeTab === 'scripture' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Scripture Search Controls Bar */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(9, 13, 20, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              position: 'relative',
              zIndex: 30
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>
                {/* Search Input Bar with Autocomplete Dropdown */}
                <div 
                  style={{ position: 'relative', flex: 1 }}
                  onClick={e => e.stopPropagation()}
                >
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#10b981' }} />
                  <input
                    ref={scriptureInputRef}
                    type="text"
                    className="form-input"
                    style={{
                      paddingLeft: '38px',
                      fontSize: '14px',
                      height: '42px',
                      borderRadius: '8px',
                      borderColor: showScriptureSuggestions && scriptureSuggestions.length > 0 ? '#10b981' : 'rgba(16, 185, 129, 0.3)',
                    }}
                    placeholder="Type book or verse (e.g. j, john 3, Psalm 23, 1 Cor 13, Rom 8:28 KJV)..."
                    value={scriptureQuery}
                    onFocus={() => setShowScriptureSuggestions(true)}
                    onChange={e => {
                      setScriptureQuery(e.target.value);
                      setShowScriptureSuggestions(true);
                      setActiveScriptureIndex(-1);
                    }}
                    onKeyDown={e => {
                      if (showScriptureSuggestions && scriptureSuggestions.length > 0) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setActiveScriptureIndex(prev => (prev < scriptureSuggestions.length - 1 ? prev + 1 : 0));
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setActiveScriptureIndex(prev => (prev > 0 ? prev - 1 : scriptureSuggestions.length - 1));
                          return;
                        }
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          const target = activeScriptureIndex >= 0 
                            ? scriptureSuggestions[activeScriptureIndex] 
                            : scriptureSuggestions[0];
                          if (target) {
                            handleSelectScriptureSuggestion(target);
                          }
                          return;
                        }
                        if (e.key === ' ') {
                          // If a suggestion is actively highlighted, complete it
                          if (activeScriptureIndex >= 0 && scriptureSuggestions[activeScriptureIndex]) {
                            e.preventDefault();
                            handleSelectScriptureSuggestion(scriptureSuggestions[activeScriptureIndex]);
                            return;
                          }
                          // If user typed partial book name like "j", "jo", "ps", "1co", complete book with a space!
                          const topSug = scriptureSuggestions[0];
                          if (topSug && topSug.type === 'book' && !scriptureQuery.includes(' ')) {
                            e.preventDefault();
                            const completedWithSpace = `${topSug.text} `;
                            setScriptureQuery(completedWithSpace);
                            setActiveScriptureIndex(-1);
                            return;
                          }
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (activeScriptureIndex >= 0 && scriptureSuggestions[activeScriptureIndex]) {
                            handleSelectScriptureSuggestion(scriptureSuggestions[activeScriptureIndex]);
                          } else {
                            setShowScriptureSuggestions(false);
                            executeScriptureSearch(scriptureQuery, selectedVersion);
                          }
                          return;
                        }
                        if (e.key === 'Escape') {
                          setShowScriptureSuggestions(false);
                          return;
                        }
                      } else if (e.key === 'Enter') {
                        setShowScriptureSuggestions(false);
                        executeScriptureSearch(scriptureQuery, selectedVersion);
                      }
                    }}
                    autoFocus
                  />
                  {scriptureLoading && (
                    <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '14px', top: '13px', color: '#10b981' }} />
                  )}

                  {/* Bible Autocomplete Popover Dropdown */}
                  {showScriptureSuggestions && scriptureSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: 'rgba(15, 23, 42, 0.98)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '8px',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(16px)',
                      zIndex: 100,
                      overflow: 'hidden',
                      maxHeight: '280px',
                      overflowY: 'auto',
                    }}>
                      <div style={{
                        padding: '6px 12px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#10b981',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}>
                        <span>Bible Suggestions (Tab, Space, Enter, or Click)</span>
                        <span style={{ color: '#64748b' }}>Tab / Space to complete</span>
                      </div>

                      {scriptureSuggestions.map((sug, idx) => {
                        const isActive = idx === activeScriptureIndex;
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                              borderBottom: idx < scriptureSuggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : undefined,
                              transition: 'background 0.1s ease',
                            }}
                            onMouseEnter={() => setActiveScriptureIndex(idx)}
                            onMouseDown={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectScriptureSuggestion(sug);
                            }}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectScriptureSuggestion(sug);
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <BookOpen size={13} color={sug.type === 'verse' ? '#10b981' : '#38bdf8'} />
                              <span style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff' }}>
                                {sug.label}
                              </span>
                              {sug.subLabel && (
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  ({sug.subLabel})
                                </span>
                              )}
                            </div>

                            {sug.badge && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                              }}>
                                {sug.badge}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Active Version Indicator Chip */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0 12px',
                    height: '42px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  onClick={() => versionListRef.current?.focus()}
                  title="Active Translation (Click to focus side panel or use ↑/↓ to change)"
                >
                  <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Version:</span>
                  <span style={{
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)'
                  }}>
                    {selectedVersion}
                  </span>
                </div>
              </div>

              {/* Quick Sermon Scripture Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Quick references:</span>
                {POPULAR_SCRIPTURES.map(sample => (
                  <button
                    key={sample.label}
                    className="btn"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      color: '#cbd5e1',
                    }}
                    onClick={() => {
                      setScriptureQuery(sample.query);
                      executeScriptureSearch(sample.query, selectedVersion);
                    }}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body: 3 Columns (Side Panel for Versions + Passage Detail + Slide Preview) */}
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1.15fr 1.35fr', flex: 1, overflow: 'hidden' }}>
              
              {/* Column 1: Bible Versions Side Panel */}
              <div
                ref={versionListRef}
                tabIndex={0}
                onKeyDown={handleVersionKeyDown}
                style={{
                  borderRight: '1px solid var(--border-subtle)',
                  background: 'rgba(10, 15, 26, 0.75)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  outline: 'none',
                }}
                title="Use ↑/↓ Arrow Keys or click to select translation"
              >
                {/* Side Panel Header */}
                <div style={{
                  padding: '9px 14px',
                  background: 'rgba(17, 24, 39, 0.85)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={13} color="#10b981" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Translations
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {AVAILABLE_BIBLE_VERSIONS.length} total
                  </span>
                </div>

                {/* Version List Scroll Area */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  {AVAILABLE_BIBLE_VERSIONS.map((v) => {
                    const isSelected = selectedVersion === v.id;
                    return (
                      <div
                        key={v.id}
                        id={`bible-version-item-${v.id}`}
                        onClick={() => handleSelectVersion(v.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isSelected 
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(6, 182, 212, 0.15))' 
                            : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected 
                            ? '1px solid rgba(16, 185, 129, 0.5)' 
                            : '1px solid transparent',
                          boxShadow: isSelected 
                            ? '0 0 12px rgba(16, 185, 129, 0.2)' 
                            : 'none',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: isSelected ? '#34d399' : '#e2e8f0',
                            }}>
                              {v.id}
                            </span>
                            {v.category && (
                              <span style={{
                                fontSize: '9px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                                color: isSelected ? '#a7f3d0' : '#64748b',
                                fontWeight: 600,
                              }}>
                                {v.category}
                              </span>
                            )}
                          </div>
                          <span style={{
                            fontSize: '10px',
                            color: isSelected ? '#cbd5e1' : '#94a3b8',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '135px',
                          }}>
                            {v.name}
                          </span>
                        </div>

                        {isSelected && (
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Check size={11} color="#ffffff" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Side Panel Footer Hint */}
                <div style={{
                  padding: '8px 10px',
                  background: 'rgba(9, 14, 23, 0.9)',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '10px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span style={{
                    padding: '1px 4px',
                    borderRadius: '3px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    fontFamily: 'monospace',
                    fontSize: '9px',
                  }}>
                    ↑↓
                  </span>
                  <span>Use arrows or click</span>
                </div>
              </div>

              {/* Middle Column: Scripture Passage Detail */}
              <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(17, 22, 34, 0.5)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Scripture Content {scriptureResult ? `(${scriptureResult.verses.length} verses)` : ''}</span>
                  <span style={{ color: '#10b981', fontSize: '10px' }}>Active: {selectedVersion}</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {scriptureLoading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <Loader2 size={32} className="animate-spin" style={{ color: '#10b981' }} />
                      <span>Fetching scripture passage online...</span>
                    </div>
                  ) : scriptureError ? (
                    <div style={{
                      padding: '16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#f87171',
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={16} />
                        Passage Notice
                      </div>
                      <div style={{ lineHeight: 1.5 }}>
                        {scriptureError}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        Tip: You can search like <code>john 2:1-5</code> or include the version like <code>john 2:1-5 KJV</code>.
                      </div>
                    </div>
                  ) : scriptureResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Header Badge */}
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>
                            {scriptureResult.reference}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {scriptureResult.versionName} ({scriptureResult.version})
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                        }}>
                          {scriptureResult.verses.length} {scriptureResult.verses.length === 1 ? 'Verse' : 'Verses'}
                        </span>
                      </div>

                      {/* Verse Breakdown List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {scriptureResult.verses.map(v => (
                          <div
                            key={v.verse}
                            style={{
                              padding: '10px 12px',
                              background: 'rgba(30, 41, 59, 0.45)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '6px',
                              display: 'flex',
                              gap: '10px',
                            }}
                          >
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', minWidth: '22px' }}>
                              {v.verse}.
                            </span>
                            <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5 }}>
                              {v.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <BookMarked size={36} style={{ opacity: 0.3, color: '#10b981' }} />
                      <span>Type a Bible reference above to query live online scripture.</span>
                      <div style={{ fontSize: '11px', color: '#475569', maxWidth: '320px', lineHeight: 1.5 }}>
                        Search examples: <code>John 3:16</code>, <code>Psalm 23:1-6</code>, <code>Romans 8:28 KJV</code>, or <code>Gen 1:1-3 NIV</code>.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Slide Preview & Auto-Save Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.75)' }}>
                {scriptureResult ? (
                  <>
                    {/* Presentation Slide Formatting Bar */}
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(17, 22, 34, 0.95)'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                          {scriptureResult.reference} ({scriptureResult.version})
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {scripturePreviewSlides.length} Presentation {scripturePreviewSlides.length === 1 ? 'Slide' : 'Slides'}
                        </div>
                      </div>

                      {/* Controls: Split Mode & Reference Header Toggle */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {/* Reference Badge Toggle */}
                        <button
                          className={`btn ${includeReferenceOnSlide ? 'btn-primary' : ''}`}
                          style={{
                            fontSize: '10px',
                            padding: '4px 8px',
                            background: includeReferenceOnSlide ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            borderColor: includeReferenceOnSlide ? 'rgba(16, 185, 129, 0.4)' : undefined,
                            color: includeReferenceOnSlide ? '#34d399' : '#94a3b8',
                          }}
                          onClick={() => setIncludeReferenceOnSlide(!includeReferenceOnSlide)}
                          title="Toggle scripture reference badge on slide preview"
                        >
                          {includeReferenceOnSlide ? 'Ref: On' : 'Ref: Off'}
                        </button>

                        {/* Split Format Selector */}
                        <div style={{ display: 'flex', gap: '2px', background: 'rgba(0, 0, 0, 0.4)', padding: '2px', borderRadius: '6px' }}>
                          <button
                            className={`btn ${scriptureSplitMode === 'verse' ? 'btn-primary' : ''}`}
                            style={{
                              fontSize: '10px',
                              padding: '3px 7px',
                              background: scriptureSplitMode === 'verse' ? '#10b981' : 'transparent',
                              borderColor: scriptureSplitMode === 'verse' ? '#10b981' : 'transparent',
                            }}
                            onClick={() => setScriptureSplitMode('verse')}
                            title="1 Verse per slide (Recommended)"
                          >
                            1 Verse/Slide
                          </button>
                          <button
                            className={`btn ${scriptureSplitMode === 'double' ? 'btn-primary' : ''}`}
                            style={{
                              fontSize: '10px',
                              padding: '3px 7px',
                              background: scriptureSplitMode === 'double' ? '#10b981' : 'transparent',
                              borderColor: scriptureSplitMode === 'double' ? '#10b981' : 'transparent',
                            }}
                            onClick={() => setScriptureSplitMode('double')}
                            title="2 Verses per slide"
                          >
                            2 Verses
                          </button>
                          <button
                            className={`btn ${scriptureSplitMode === 'full' ? 'btn-primary' : ''}`}
                            style={{
                              fontSize: '10px',
                              padding: '3px 7px',
                              background: scriptureSplitMode === 'full' ? '#10b981' : 'transparent',
                              borderColor: scriptureSplitMode === 'full' ? '#10b981' : 'transparent',
                            }}
                            onClick={() => setScriptureSplitMode('full')}
                            title="Full passage on single slide"
                          >
                            Full Passage
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Auto-Save Notification Banner */}
                    {scriptureSavedFeedback && (
                      <div style={{
                        padding: '6px 16px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <BookCheck size={13} />
                        <span>{scriptureSavedFeedback}</span>
                      </div>
                    )}

                    {/* Formatted Slides Preview Cards */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {scripturePreviewSlides.map((slideText, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(30, 41, 59, 0.65)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', minWidth: '18px', marginTop: '2px' }}>
                            {idx + 1}.
                          </span>
                          <div style={{ fontSize: '13px', color: '#f1f5f9', whiteSpace: 'pre-line', lineHeight: 1.5, fontWeight: 500 }}>
                            {slideText}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div style={{
                      padding: '14px 16px',
                      borderTop: '1px solid var(--border-subtle)',
                      background: 'rgba(17, 22, 34, 0.95)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Saved in local library under <code>scripture</code>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn"
                          style={{ fontSize: '12px', padding: '7px 14px', background: scriptureScheduleFeedback ? '#10b981' : undefined }}
                          onClick={handleAddToScheduleScripture}
                        >
                          {scriptureScheduleFeedback ? <Check size={14} /> : <ListPlus size={14} />}
                          {scriptureScheduleFeedback ? 'Added to Schedule!' : 'Add to Schedule'}
                        </button>

                        <button
                          className="btn btn-primary"
                          style={{
                            fontSize: '12px',
                            padding: '7px 16px',
                            background: scriptureLiveFeedback ? '#10b981' : 'linear-gradient(135deg, #10b981, #059669)',
                            borderColor: '#10b981',
                          }}
                          onClick={handleGoLiveScripture}
                        >
                          {scriptureLiveFeedback ? <Check size={14} /> : <Play size={14} />}
                          {scriptureLiveFeedback ? 'Loading Live...' : 'Go Live Now'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', padding: '2rem', textAlign: 'center', gap: '10px' }}>
                    <BookOpen size={36} style={{ opacity: 0.3, color: '#10b981' }} />
                    <span>Enter a verse reference on the left to preview slide layout and load live.</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ---------------- LYRICS TAB (WITH LOCAL-FIRST SEARCH & AUTOCOMPLETE) ---------------- */}
        {activeTab === 'lyrics' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Search Input Bar with Autocomplete */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(9, 13, 20, 0.6)',
              position: 'relative',
              zIndex: 30
            }}>
              <div 
                style={{ position: 'relative' }}
                onClick={e => e.stopPropagation()}
              >
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#38bdf8' }} />
                <input
                  ref={lyricInputRef}
                  type="text"
                  className="form-input"
                  style={{
                    paddingLeft: '36px',
                    fontSize: '14px',
                    height: '42px',
                    borderRadius: '8px',
                    borderColor: showLyricSuggestions && lyricSuggestions.length > 0 ? '#38bdf8' : undefined,
                  }}
                  placeholder="Search songs or hymns (e.g. Goodness of God, Way Maker, Oceans, Amazing Grace)..."
                  value={lyricsQuery}
                  onFocus={() => setShowLyricSuggestions(true)}
                  onChange={e => {
                    setLyricsQuery(e.target.value);
                    setShowLyricSuggestions(true);
                    setActiveLyricIndex(-1);
                  }}
                  onKeyDown={e => {
                    if (showLyricSuggestions && lyricSuggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveLyricIndex(prev => (prev < lyricSuggestions.length - 1 ? prev + 1 : 0));
                        return;
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveLyricIndex(prev => (prev > 0 ? prev - 1 : lyricSuggestions.length - 1));
                        return;
                      }
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const target = activeLyricIndex >= 0 
                          ? lyricSuggestions[activeLyricIndex] 
                          : lyricSuggestions[0];
                        if (target) {
                          handleSelectLyricSuggestion(target);
                        }
                        return;
                      }
                      if (e.key === ' ' && activeLyricIndex >= 0 && lyricSuggestions[activeLyricIndex]) {
                        e.preventDefault();
                        handleSelectLyricSuggestion(lyricSuggestions[activeLyricIndex]);
                        return;
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (activeLyricIndex >= 0 && lyricSuggestions[activeLyricIndex]) {
                          handleSelectLyricSuggestion(lyricSuggestions[activeLyricIndex]);
                        } else {
                          setShowLyricSuggestions(false);
                        }
                        return;
                      }
                      if (e.key === 'Escape') {
                        setShowLyricSuggestions(false);
                        return;
                      }
                    }
                  }}
                  autoFocus
                />
                {lyricsLoading && (
                  <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '14px', top: '13px', color: '#38bdf8' }} />
                )}

                {/* Lyric Autocomplete Popover Dropdown (Local Library First!) */}
                {showLyricSuggestions && lyricSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(15, 23, 42, 0.98)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '8px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(16px)',
                    zIndex: 100,
                    overflow: 'hidden',
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}>
                    <div style={{
                      padding: '6px 12px',
                      background: 'rgba(56, 189, 248, 0.08)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#38bdf8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                      <span>Song Suggestions (Tab, Enter, or Click)</span>
                      <span style={{ color: '#64748b' }}>Tab to complete</span>
                    </div>

                    {lyricSuggestions.map((sug, idx) => {
                      const isActive = idx === activeLyricIndex;
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            background: isActive 
                              ? (sug.isLocal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)')
                              : 'transparent',
                            borderBottom: idx < lyricSuggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : undefined,
                            transition: 'background 0.1s ease',
                          }}
                          onMouseEnter={() => setActiveLyricIndex(idx)}
                          onMouseDown={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectLyricSuggestion(sug);
                          }}
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectLyricSuggestion(sug);
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {sug.isLocal ? (
                              <HardDrive size={13} color="#10b981" />
                            ) : (
                              <Music size={13} color="#38bdf8" />
                            )}
                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff' }}>
                              {sug.label}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {sug.subLabel}
                            </span>
                          </div>

                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: sug.isLocal ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: sug.isLocal ? '#34d399' : '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {sug.isLocal && <CheckCheck size={11} />}
                            {sug.badge}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Content: 2 Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr', flex: 1, overflow: 'hidden' }}>
              
              {/* Left Column: Results List with LOCAL-FIRST Sorting */}
              <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(17, 22, 34, 0.5)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    Search Results ({combinedSongResults.length})
                    {localSongMatches.length > 0 && (
                      <span style={{ color: '#10b981', marginLeft: '6px' }}>
                        • {localSongMatches.length} in library
                      </span>
                    )}
                  </span>
                  <span style={{ color: '#38bdf8' }}>Click to select</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lyricsQuery.trim() === '' ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Globe size={32} style={{ opacity: 0.3 }} />
                      <span>Type a song name to search your local library and online lyric databases.</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                        {['Goodness of God', 'Way Maker', 'Oceans', 'What a Beautiful Name', '10,000 Reasons', 'King of Kings'].map(sample => (
                          <button
                            key={sample}
                            className="btn"
                            style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255, 255, 255, 0.05)' }}
                            onClick={() => setLyricsQuery(sample)}
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : combinedSongResults.length === 0 && !lyricsLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '13px' }}>
                      No songs found matching "{lyricsQuery}". Try a different spelling or artist name.
                    </div>
                  ) : (
                    combinedSongResults.map((song) => {
                      const isSelected = selectedSong?.id === song.id;
                      const isLocal = song.isLocal;

                      return (
                        <div
                          key={song.id}
                          className={`interactive-card ${isSelected ? 'active' : ''}`}
                          style={{
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            position: 'relative',
                            borderColor: isLocal ? 'rgba(16, 185, 129, 0.3)' : undefined,
                            background: isLocal ? 'rgba(16, 185, 129, 0.04)' : undefined,
                          }}
                          onClick={() => handleSelectSong(song)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isLocal && (
                                <span title="Already saved in your local library" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  <HardDrive size={13} color="#10b981" />
                                </span>
                              )}
                              <span style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? '#38bdf8' : '#ffffff' }}>
                                {song.trackName}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isLocal && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#34d399',
                                }}>
                                  Saved Locally
                                </span>
                              )}
                              <ChevronRight size={15} style={{ opacity: isSelected ? 1 : 0.4, color: isSelected ? '#38bdf8' : undefined }} />
                            </div>
                          </div>

                          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                            {song.artistName} {song.albumName ? `• ${song.albumName}` : ''}
                          </div>

                          {song.snippet && (
                            <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              "{song.snippet}"
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Slide Preview & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.7)' }}>
                {selectedSong ? (
                  <>
                    {/* Preview Top Header */}
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(17, 22, 34, 0.9)'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{selectedSong.trackName}</span>
                          {selectedSong.isLocal && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                              Local Library
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          by {selectedSong.artistName} &middot; {lyricsPreviewSlides.length} Presentation Slides
                        </div>
                      </div>

                      {/* Split Format Selector */}
                      {!selectedSong.isLocal && (
                        <div style={{ display: 'flex', gap: '3px', background: 'rgba(0, 0, 0, 0.4)', padding: '2px', borderRadius: '6px' }}>
                          <button
                            className={`btn ${lyricsSplitMode === 'smart' ? 'btn-primary' : ''}`}
                            style={{ fontSize: '10px', padding: '3px 7px' }}
                            onClick={() => setLyricsSplitMode('smart')}
                            title="Smart 2-3 lines per slide"
                          >
                            Smart (2-3 lines)
                          </button>
                          <button
                            className={`btn ${lyricsSplitMode === 'stanzas' ? 'btn-primary' : ''}`}
                            style={{ fontSize: '10px', padding: '3px 7px' }}
                            onClick={() => setLyricsSplitMode('stanzas')}
                            title="Full stanzas per slide"
                          >
                            Stanzas
                          </button>
                          <button
                            className={`btn ${lyricsSplitMode === 'lines' ? 'btn-primary' : ''}`}
                            style={{ fontSize: '10px', padding: '3px 7px' }}
                            onClick={() => setLyricsSplitMode('lines')}
                            title="1 line per slide"
                          >
                            Single Lines
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Auto-Save Notification Banner */}
                    {lyricsSavedFeedback && (
                      <div style={{
                        padding: '6px 16px',
                        background: selectedSong.isLocal ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        borderBottom: `1px solid ${selectedSong.isLocal ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        color: selectedSong.isLocal ? '#38bdf8' : '#34d399',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <BookCheck size={13} />
                        <span>{lyricsSavedFeedback}</span>
                      </div>
                    )}

                    {/* Formatted Slides Preview Grid */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {lyricsPreviewSlides.map((slideText, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(30, 41, 59, 0.65)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', minWidth: '18px', marginTop: '2px' }}>
                            {idx + 1}.
                          </span>
                          <div style={{ fontSize: '13px', color: '#f1f5f9', whiteSpace: 'pre-line', lineHeight: 1.5, fontWeight: 500 }}>
                            {slideText}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div style={{
                      padding: '14px 16px',
                      borderTop: '1px solid var(--border-subtle)',
                      background: 'rgba(17, 22, 34, 0.95)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {selectedSong.isLocal ? 'Using saved version in library' : 'Saved locally in store.json'}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn"
                          style={{ fontSize: '12px', padding: '7px 14px', background: lyricsScheduleFeedback ? '#10b981' : undefined }}
                          onClick={handleAddToScheduleLyrics}
                        >
                          {lyricsScheduleFeedback ? <Check size={14} /> : <ListPlus size={14} />}
                          {lyricsScheduleFeedback ? 'Added to Schedule!' : 'Add to Schedule'}
                        </button>

                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '12px', padding: '7px 16px' }}
                          onClick={handleGoLiveLyrics}
                        >
                          {lyricsLiveFeedback ? <Check size={14} /> : <Play size={14} />}
                          {lyricsLiveFeedback ? 'Loading Live...' : 'Go Live Now'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', padding: '2rem', textAlign: 'center', gap: '8px' }}>
                    <Music size={32} style={{ opacity: 0.3 }} />
                    <span>Select any song from the left search list to preview its slide layout and load it live.</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
