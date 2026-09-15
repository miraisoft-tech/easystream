import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Play,
  ListPlus,
  BookmarkPlus,
  Check,
  X,
  Loader2,
  ChevronRight,
  BookMarked,
  Sparkles,
  Layers,
  Tv,
  ExternalLink,
  Sliders,
  CheckCheck
} from 'lucide-react';
import { LibraryItem } from '../types';
import { BIBLE_BOOKS, getBibleSuggestions, BibleBook, BibleSuggestion } from '../data/bibleBooks';

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
  { label: 'John 3:16', query: 'John 3:16', tag: 'Salvation' },
  { label: 'Psalm 23:1', query: 'Psalm 23:1', tag: 'Comfort' },
  { label: 'Romans 8:28', query: 'Romans 8:28', tag: 'Assurance' },
  { label: 'Philippians 4:6', query: 'Philippians 4:6', tag: 'Peace' },
  { label: '1 Cor 13:4', query: '1 Cor 13:4', tag: 'Love' },
  { label: 'Isaiah 40:31', query: 'Isaiah 40:31', tag: 'Strength' },
  { label: 'Proverbs 3:5', query: 'Proverbs 3:5', tag: 'Trust' },
  { label: 'Matthew 28:19', query: 'Matthew 28:19', tag: 'Commission' },
  { label: 'Ephesians 6:10', query: 'Ephesians 6:10', tag: 'Armor' },
  { label: 'Hebrews 11:1', query: 'Hebrews 11:1', tag: 'Faith' },
];

interface ScriptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  library?: LibraryItem[];
  onSaveLibraryItem: (item: LibraryItem) => void;
  onAddToSchedule: (item: LibraryItem) => void;
  onGoLiveWithItem: (item: LibraryItem) => void;
  initialQuery?: string;
}

export const ScriptureModal: React.FC<ScriptureModalProps> = ({
  isOpen,
  onClose,
  library = [],
  onSaveLibraryItem,
  onAddToSchedule,
  onGoLiveWithItem,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedVersion, setSelectedVersion] = useState('KJV');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OnlineScriptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<'verse' | 'double' | 'full'>('verse');
  const [includeReferenceOnSlide, setIncludeReferenceOnSlide] = useState(true);

  // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Book browser drawer state
  const [showBookBrowser, setShowBookBrowser] = useState(false);
  const [selectedBookForBrowser, setSelectedBookForBrowser] = useState<BibleBook | null>(null);

  // Feedback states
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [liveFeedback, setLiveFeedback] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState(false);

  // Focus on mount/open
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setQuery(initialQuery);
        executeSearch(initialQuery, selectedVersion);
      }
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, initialQuery]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (showSuggestions) {
          setShowSuggestions(false);
        } else if (showBookBrowser) {
          setShowBookBrowser(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showSuggestions, showBookBrowser, onClose]);

  // Suggestions computation
  const suggestions: BibleSuggestion[] = useMemo(() => {
    if (!query.trim() || !showSuggestions) return [];
    return getBibleSuggestions(query, selectedVersion);
  }, [query, showSuggestions, selectedVersion]);

  // Helper to check if query has chapter number
  const hasChapterNumber = (q: string): boolean => {
    const trimmed = q.trim();
    if (!trimmed) return false;
    const versionCodes = AVAILABLE_BIBLE_VERSIONS.map(v => v.id);
    const versionRegex = new RegExp(`[\\s,\\(-]+(${versionCodes.join('|')})[\\)\\s]*$`, 'i');
    const cleaned = trimmed.replace(versionRegex, '').trim();
    const strippedLeadingNum = cleaned.replace(/^[1-3]\s*[a-zA-Z]+/i, '');
    return /\d+/.test(strippedLeadingNum);
  };

  // Search API execution
  const executeSearch = async (searchQuery: string, versionOverride?: string) => {
    const raw = searchQuery.trim();
    setShowSuggestions(false);
    if (!raw) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!hasChapterNumber(raw)) {
      setLoading(false);
      setResult(null);
      setError(`Please include a chapter number (e.g. "${raw} 1" or "${raw} 3:16").`);
      setShowSuggestions(true);
      return;
    }

    // Check if query contains an embedded Bible version (e.g. "john 3:16 NIV", "romans 8:28 KJV")
    const versionCodes = AVAILABLE_BIBLE_VERSIONS.map(v => v.id);
    const versionRegex = new RegExp(`[\\s,\\(-]+(${versionCodes.join('|')})[\\)\\s]*$`, 'i');
    const match = raw.match(versionRegex);

    let activeVersion = versionOverride || selectedVersion;
    if (match) {
      const detected = match[1].toUpperCase();
      const validVer = AVAILABLE_BIBLE_VERSIONS.find(v => v.id.toUpperCase() === detected);
      if (validVer) {
        activeVersion = validVer.id;
        setSelectedVersion(validVer.id);
      }
    }

    setLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const url = `${apiBase}/api/scripture/search?q=${encodeURIComponent(raw)}&version=${encodeURIComponent(activeVersion)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setResult(null);
      } else if (data.verses && data.verses.length > 0) {
        setResult(data);
        setError(null);
      } else {
        setError(`No verses found for "${raw}" in ${activeVersion}.`);
        setResult(null);
      }
    } catch (err: any) {
      setError(`Failed to fetch scripture: ${err?.message || 'Network error'}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersion = (verId: string) => {
    setSelectedVersion(verId);
    if (query && hasChapterNumber(query)) {
      executeSearch(query, verId);
    }
  };

  const handleSelectSuggestion = (sug: BibleSuggestion) => {
    setQuery(sug.text);
    setShowSuggestions(false);
    if (sug.type === 'verse') {
      executeSearch(sug.text, selectedVersion);
    } else {
      inputRef.current?.focus();
    }
  };

  // Convert raw verses to slides based on split mode (Default: 1 verse per slide)
  const generatedSlides = useMemo(() => {
    if (!result || !result.verses || result.verses.length === 0) return [];

    // Extract base book & chapter for single-verse citations (e.g. "John 3:16-17" -> "John 3")
    const bookChapterMatch = result.reference.match(/^([\d\s]*[A-Za-z\s]+?\s*\d+)/);
    const baseBookChapter = bookChapterMatch ? bookChapterMatch[1].trim() : result.reference;

    if (splitMode === 'full') {
      const refHeader = `${result.reference}`;
      const text = result.verses.map(v => `${v.verse} ${v.text}`).join('\n\n');
      return [includeReferenceOnSlide ? `${text}\n\n${refHeader}` : text];
    }

    if (splitMode === 'double') {
      const slides: string[] = [];
      for (let i = 0; i < result.verses.length; i += 2) {
        const pair = result.verses.slice(i, i + 2);
        const pairRef = pair.length === 1 ? `${baseBookChapter}:${pair[0].verse}` : `${baseBookChapter}:${pair[0].verse}-${pair[1].verse}`;
        const text = pair.map(v => `${v.verse} ${v.text}`).join('\n\n');
        slides.push(includeReferenceOnSlide ? `${text}\n\n${pairRef}` : text);
      }
      return slides;
    }

    // Default 'verse': Exactly 1 verse per slide
    return result.verses.map(v => {
      const cleanVerse = v.text.replace(/^\d+[\s:.]\s*/, '').trim();
      const verseRef = result.verses.length === 1 ? result.reference : `${baseBookChapter}:${v.verse}`;
      return includeReferenceOnSlide ? `${cleanVerse}\n\n${verseRef}` : cleanVerse;
    });
  }, [result, splitMode, includeReferenceOnSlide]);

  const createLibraryItemFromResult = (): LibraryItem | null => {
    if (!result || generatedSlides.length === 0) return null;
    return {
      id: `scripture-${Date.now()}`,
      title: `${result.reference} (${result.version})`,
      category: 'scripture',
      author: result.versionName || result.version,
      content: result.plainContent,
      lines: generatedSlides,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  const handleGoLive = () => {
    const item = createLibraryItemFromResult();
    if (!item) return;
    onGoLiveWithItem(item);
    setLiveFeedback(true);
    setTimeout(() => setLiveFeedback(false), 2500);
  };

  const handleAddToSchedule = () => {
    const item = createLibraryItemFromResult();
    if (!item) return;
    onAddToSchedule(item);
    setScheduleFeedback(true);
    setTimeout(() => setScheduleFeedback(false), 2500);
  };

  const handleSaveToLibrary = () => {
    const item = createLibraryItemFromResult();
    if (!item) return;
    onSaveLibraryItem(item);
    setSavedFeedback('Saved to Library');
    setTimeout(() => setSavedFeedback(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content studio-panel"
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #111827 0%, #0b0f19 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              }}
            >
              <BookOpen size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  Scripture Presenter & Bible Search
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    borderRadius: '999px',
                    fontWeight: 700,
                  }}
                >
                  LIVE BIBLE
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Search any book, chapter, or verse across multiple translations and project live in seconds
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: showBookBrowser ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                borderColor: showBookBrowser ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
                color: showBookBrowser ? '#38bdf8' : '#e2e8f0',
              }}
              onClick={() => setShowBookBrowser(!showBookBrowser)}
            >
              <BookMarked size={14} />
              {showBookBrowser ? 'Hide Books' : 'Browse 66 Books'}
            </button>

            <button
              className="btn"
              style={{ padding: '6px 8px', background: 'transparent', border: 'none', color: '#94a3b8' }}
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar + Translation Selector Controls */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}>
            {/* Input with Auto-complete */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                color="#38bdf8"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                  setActiveSuggestionIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={e => {
                  if (showSuggestions && suggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
                      return;
                    }
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const target = activeSuggestionIndex >= 0 ? suggestions[activeSuggestionIndex] : suggestions[0];
                      if (target) {
                        handleSelectSuggestion(target);
                      }
                      return;
                    }
                    if (e.key === ' ') {
                      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
                        e.preventDefault();
                        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
                        return;
                      }
                      const topSug = suggestions[0];
                      if (topSug && topSug.type === 'book' && !query.includes(' ')) {
                        e.preventDefault();
                        setQuery(`${topSug.text} `);
                        setActiveSuggestionIndex(-1);
                        return;
                      }
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
                        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
                      } else {
                        setShowSuggestions(false);
                        executeSearch(query, selectedVersion);
                      }
                      return;
                    }
                    if (e.key === 'Escape') {
                      setShowSuggestions(false);
                      return;
                    }
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    executeSearch(query, selectedVersion);
                  }
                }}
                placeholder="Search scripture reference e.g., 'John 3:16', 'Psalm 23', 'Romans 8:28-39' or 'Gen 1:1'..."
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
                }}
              />

              {loading && (
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                  <Loader2 size={16} color="#38bdf8" className="spin-animation" />
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: '#0f172a',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '10px',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.8)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}
                >
                  {suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: idx === activeSuggestionIndex ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                      }}
                      onMouseDown={e => {
                        e.preventDefault();
                        handleSelectSuggestion(sug);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={14} color="#38bdf8" />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{sug.label}</span>
                        {sug.subLabel && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {sug.subLabel}</span>
                        )}
                      </div>
                      {sug.badge && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            borderRadius: '4px',
                          }}
                        >
                          {sug.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Translation Dropdown */}
            <div style={{ width: '220px' }}>
              <select
                value={selectedVersion}
                onChange={e => handleSelectVersion(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '10px',
                  color: '#38bdf8',
                  fontSize: '14px',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {AVAILABLE_BIBLE_VERSIONS.map(ver => (
                  <option key={ver.id} value={ver.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {ver.id} - {ver.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              className="btn btn-primary"
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 700,
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
              }}
              onClick={() => executeSearch(query, selectedVersion)}
              disabled={loading || !query.trim()}
            >
              <Search size={15} />
              Look Up
            </button>
          </div>

          {/* Quick Popular Scripture Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
              POPULAR:
            </span>
            {POPULAR_SCRIPTURES.map((item, idx) => (
              <button
                key={idx}
                className="btn"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: query === item.query ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: query === item.query ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                  color: query === item.query ? '#38bdf8' : '#cbd5e1',
                  whiteSpace: 'nowrap',
                  borderRadius: '999px',
                }}
                onClick={() => {
                  setQuery(item.query);
                  executeSearch(item.query, selectedVersion);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 66 Books Quick Browser Drawer */}
        {showBookBrowser && (
          <div
            style={{
              padding: '16px 24px',
              background: 'rgba(15, 23, 42, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                Select Book & Chapter
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Click any book to quickly load</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px' }}>
              {BIBLE_BOOKS.map(b => (
                <button
                  key={b.id}
                  className="btn"
                  style={{
                    fontSize: '11px',
                    padding: '6px 8px',
                    justifyContent: 'flex-start',
                    background:
                      selectedBookForBrowser?.id === b.id
                        ? 'rgba(56, 189, 248, 0.25)'
                        : 'rgba(255, 255, 255, 0.04)',
                    borderColor:
                      selectedBookForBrowser?.id === b.id ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                    color: b.testament === 'OT' ? '#cbd5e1' : '#38bdf8',
                  }}
                  onClick={() => {
                    setSelectedBookForBrowser(b);
                    setQuery(`${b.name} 1`);
                    executeSearch(`${b.name} 1`, selectedVersion);
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{b.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left / Center: Passage Content & Slide Cards */}
          <div
            style={{
              flex: 1,
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {error && (
              <div
                style={{
                  padding: '14px 18px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: '#f87171',
                  fontSize: '13px',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {!result && !loading && !error && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#64748b',
                  gap: '12px',
                  padding: '40px 0',
                }}
              >
                <BookOpen size={48} style={{ opacity: 0.3 }} />
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 4px 0', color: '#94a3b8', fontSize: '16px' }}>
                    Ready to Present Scripture
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', maxWidth: '400px' }}>
                    Type a reference above like <strong>John 3:16</strong> or choose from the popular scripture chips.
                  </p>
                </div>
              </div>
            )}

            {result && (
              <>
                {/* Passage Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>
                      {result.reference}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {result.versionName || result.version} • {result.totalVerses} Verse
                      {result.totalVerses > 1 ? 's' : ''} • {generatedSlides.length} Slide
                      {generatedSlides.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Split Mode Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SPLIT:</span>
                    <button
                      className="btn"
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: splitMode === 'verse' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        borderColor: splitMode === 'verse' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                        color: splitMode === 'verse' ? '#38bdf8' : '#cbd5e1',
                      }}
                      onClick={() => setSplitMode('verse')}
                      title="1 verse per slide (recommended for big readable display)"
                    >
                      1 Verse/Slide
                    </button>
                    <button
                      className="btn"
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: splitMode === 'double' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        borderColor: splitMode === 'double' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                        color: splitMode === 'double' ? '#38bdf8' : '#cbd5e1',
                      }}
                      onClick={() => setSplitMode('double')}
                      title="2 verses per slide"
                    >
                      2 Verses/Slide
                    </button>
                    <button
                      className="btn"
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: splitMode === 'full' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        borderColor: splitMode === 'full' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                        color: splitMode === 'full' ? '#38bdf8' : '#cbd5e1',
                      }}
                      onClick={() => setSplitMode('full')}
                      title="Full passage on single slide"
                    >
                      Full Passage
                    </button>
                  </div>
                </div>

                {/* Generated Slide Preview Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                      Presentation Slides Preview ({generatedSlides.length})
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeReferenceOnSlide}
                        onChange={e => setIncludeReferenceOnSlide(e.target.checked)}
                      />
                      Include reference header on slides
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {generatedSlides.map((slideText, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '110px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '13px',
                            lineHeight: 1.5,
                            color: '#ffffff',
                            whiteSpace: 'pre-line',
                            fontFamily: 'Montserrat, sans-serif',
                          }}
                        >
                          {slideText}
                        </div>
                        <div
                          style={{
                            marginTop: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            paddingTop: '6px',
                          }}
                        >
                          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
                            SLIDE {idx + 1} OF {generatedSlides.length}
                          </span>
                          <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>
                            {result.version}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {savedFeedback && (
              <span style={{ fontSize: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> {savedFeedback}
              </span>
            )}
            {liveFeedback && (
              <span style={{ fontSize: '12px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCheck size={14} /> Sent to Live Display!
              </span>
            )}
            {scheduleFeedback && (
              <span style={{ fontSize: '12px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Added to Service Rundown
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn"
              style={{
                fontSize: '13px',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
              }}
              onClick={handleSaveToLibrary}
              disabled={!result || generatedSlides.length === 0}
              title="Save scripture to local church media library"
            >
              <BookmarkPlus size={15} />
              Save to Library
            </button>

            <button
              className="btn"
              style={{
                fontSize: '13px',
                padding: '8px 16px',
                background: 'rgba(167, 139, 250, 0.15)',
                borderColor: 'rgba(167, 139, 250, 0.4)',
                color: '#c4b5fd',
                fontWeight: 700,
              }}
              onClick={handleAddToSchedule}
              disabled={!result || generatedSlides.length === 0}
              title="Add this scripture reading to the active service schedule"
            >
              <ListPlus size={15} />
              + Add to Schedule
            </button>

            <button
              className="btn btn-primary"
              style={{
                fontSize: '13px',
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                fontWeight: 800,
                border: 'none',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                gap: '8px',
              }}
              onClick={handleGoLive}
              disabled={!result || generatedSlides.length === 0}
              title="Instantly project this scripture reading live to the congregation & stream"
            >
              <Play size={15} fill="#ffffff" />
              ▶ GO LIVE NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
