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
  Sparkles, 
  Layers, 
  BookCheck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { LibraryItem, ScheduleItem, AppState } from '../types';
import { parseLyricsToSlides } from '../utils/lyricParser';

interface OnlineSongResult {
  id: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  snippet?: string;
  plainLyrics: string;
}

interface OnlineLyricsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLibraryItem: (item: LibraryItem) => void;
  onAddToSchedule: (item: LibraryItem) => void;
  onGoLiveWithItem: (item: LibraryItem) => void;
}

export const OnlineLyricsSearchModal: React.FC<OnlineLyricsSearchModalProps> = ({
  isOpen,
  onClose,
  onSaveLibraryItem,
  onAddToSchedule,
  onGoLiveWithItem,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OnlineSongResult[]>([]);
  const [selectedSong, setSelectedSong] = useState<OnlineSongResult | null>(null);
  const [splitMode, setSplitMode] = useState<'smart' | 'stanzas' | 'lines'>('smart');
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [liveFeedback, setLiveFeedback] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedSong(null);
      setLoading(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/lyrics/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        const songs: OnlineSongResult[] = data.results || [];
        setResults(songs);
        if (songs.length > 0 && !selectedSong) {
          handleSelectSong(songs[0]);
        }
      } catch (err) {
        console.error('Failed to search lyrics:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  if (!isOpen) return null;

  // Convert selected song to a full LibraryItem
  const getLibraryItemFromSong = (song: OnlineSongResult, mode = splitMode): LibraryItem => {
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

  // When a user selects a song from the list:
  // 1. Set as selected
  // 2. Automatically save locally to persistent library/song list (store.json)
  const handleSelectSong = (song: OnlineSongResult) => {
    setSelectedSong(song);
    const item = getLibraryItemFromSong(song, splitMode);
    
    // Automatically save into local persistent database
    onSaveLibraryItem(item);
    setSavedFeedback(`"${song.trackName}" automatically saved to local library!`);
  };

  // Instant Go Live
  const handleGoLive = () => {
    if (!selectedSong) return;
    const item = getLibraryItemFromSong(selectedSong, splitMode);
    onSaveLibraryItem(item); // Ensure saved
    onGoLiveWithItem(item);
    setLiveFeedback(true);
    setTimeout(() => {
      setLiveFeedback(false);
      onClose();
    }, 600);
  };

  // Add to Service Schedule
  const handleAddToSchedule = () => {
    if (!selectedSong) return;
    const item = getLibraryItemFromSong(selectedSong, splitMode);
    onSaveLibraryItem(item); // Ensure saved
    onAddToSchedule(item);
    setScheduleFeedback(true);
    setTimeout(() => setScheduleFeedback(false), 1500);
  };

  // Format preview slides for the right panel
  const previewSlides = selectedSong ? parseLyricsToSlides(selectedSong.plainLyrics, splitMode) : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '940px', height: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={15} color="#ffffff" />
            </div>
            <span>Online Song Lyrics Search & Auto-Save</span>
          </div>
          <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent' }}>
            <X size={16} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(9, 13, 20, 0.6)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '14px', height: '42px', borderRadius: '8px' }}
              placeholder="Search worship song title, artist, or lyrics (e.g. Goodness of God, Way Maker, Oceans, Hillsong, Bethel)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {loading && (
              <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '14px', top: '13px', color: '#38bdf8' }} />
            )}
          </div>
        </div>

        {/* Modal Content: 2 Columns (Results List on Left, Slide Preview & Auto-Save Actions on Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Column: Search Results List */}
          <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 16px', background: 'rgba(17, 22, 34, 0.5)', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between' }}>
              <span>Search Results ({results.length})</span>
              <span style={{ color: '#38bdf8' }}>Click to select & auto-save</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {query.trim() === '' ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Globe size={32} style={{ opacity: 0.3 }} />
                  <span>Type a song name above to search free online lyric databases.</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                    {['Goodness of God', 'Way Maker', 'Oceans', 'What a Beautiful Name', '10,000 Reasons', 'King of Kings'].map(sample => (
                      <button
                        key={sample}
                        className="btn"
                        style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255, 255, 255, 0.05)' }}
                        onClick={() => setQuery(sample)}
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 && !loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '13px' }}>
                  No online lyrics found matching "{query}". Try a different spelling or artist name.
                </div>
              ) : (
                results.map((song) => {
                  const isSelected = selectedSong?.id === song.id;
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
                      }}
                      onClick={() => handleSelectSong(song)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? '#38bdf8' : '#ffffff' }}>
                          {song.trackName}
                        </div>
                        <ChevronRight size={15} style={{ opacity: isSelected ? 1 : 0.4, color: isSelected ? '#38bdf8' : undefined }} />
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

          {/* Right Column: Slide Preview & Auto-Save Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.7)' }}>
            {selectedSong ? (
              <>
                {/* Preview Top Header & Chunk Controls */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(17, 22, 34, 0.9)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                      {selectedSong.trackName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      by {selectedSong.artistName} &middot; {previewSlides.length} Presentation Slides
                    </div>
                  </div>

                  {/* Split Format Selector */}
                  <div style={{ display: 'flex', gap: '3px', background: 'rgba(0, 0, 0, 0.4)', padding: '2px', borderRadius: '6px' }}>
                    <button
                      className={`btn ${splitMode === 'smart' ? 'btn-primary' : ''}`}
                      style={{ fontSize: '10px', padding: '3px 7px' }}
                      onClick={() => setSplitMode('smart')}
                      title="Smart 2-3 lines per slide"
                    >
                      Smart (2-3 lines)
                    </button>
                    <button
                      className={`btn ${splitMode === 'stanzas' ? 'btn-primary' : ''}`}
                      style={{ fontSize: '10px', padding: '3px 7px' }}
                      onClick={() => setSplitMode('stanzas')}
                      title="Full stanzas per slide"
                    >
                      Stanzas
                    </button>
                    <button
                      className={`btn ${splitMode === 'lines' ? 'btn-primary' : ''}`}
                      style={{ fontSize: '10px', padding: '3px 7px' }}
                      onClick={() => setSplitMode('lines')}
                      title="1 line per slide"
                    >
                      Single Lines
                    </button>
                  </div>
                </div>

                {/* Auto-Save Notification Banner */}
                {savedFeedback && (
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
                    <span>Auto-saved to local song library & synced on disk!</span>
                  </div>
                )}

                {/* Formatted Slides Preview Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {previewSlides.map((slideText, idx) => (
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
                <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(17, 22, 34, 0.95)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Saved locally in <code>store.json</code>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn"
                      style={{ fontSize: '12px', padding: '7px 14px', background: scheduleFeedback ? '#10b981' : undefined }}
                      onClick={handleAddToSchedule}
                    >
                      {scheduleFeedback ? <Check size={14} /> : <ListPlus size={14} />}
                      {scheduleFeedback ? 'Added to Schedule!' : 'Add to Schedule'}
                    </button>

                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '7px 16px' }}
                      onClick={handleGoLive}
                    >
                      {liveFeedback ? <Check size={14} /> : <Play size={14} />}
                      {liveFeedback ? 'Loading Live...' : 'Go Live Now'}
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
    </div>
  );
};
