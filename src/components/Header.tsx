import React, { useState } from 'react';
import { 
  Tv, 
  Layers, 
  Mic2, 
  Bell, 
  BookOpen, 
  Sparkles, 
  RotateCcw, 
  ExternalLink,
  Circle,
  Radio,
  Image as ImageIcon,
  Search,
  Globe
} from 'lucide-react';
import { LiveState } from '../types';

interface HeaderProps {
  isConnected: boolean;
  liveState: LiveState;
  onUpdateLiveState: (update: Partial<LiveState>) => void;
  onSetQuickAlert: (text: string | null) => void;
  onOpenLibrary: () => void;
  onOpenOnlineSearch: () => void;
  onResetToDefault: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  liveState,
  onUpdateLiveState,
  onSetQuickAlert,
  onOpenLibrary,
  onOpenOnlineSearch,
  onResetToDefault,
}) => {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertText, setAlertText] = useState(liveState.quickAlert || '');

  const toggleBlackout = () => {
    onUpdateLiveState({ isBlackout: !liveState.isBlackout });
  };

  const toggleClearText = () => {
    onUpdateLiveState({ isClearText: !liveState.isClearText });
  };

  const toggleLogo = () => {
    onUpdateLiveState({ isLogo: !liveState.isLogo });
  };

  const handleApplyAlert = (e: React.FormEvent) => {
    e.preventDefault();
    onSetQuickAlert(alertText.trim() ? alertText.trim() : null);
    setIsAlertModalOpen(false);
  };

  const handleClearAlert = () => {
    setAlertText('');
    onSetQuickAlert(null);
    setIsAlertModalOpen(false);
  };

  return (
    <header className="studio-header">
      {/* Left: Brand + Connection Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div className="studio-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
            }}>
              <Radio size={16} color="#ffffff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.02em' }}>
              Worship<span style={{ color: '#38bdf8' }}>Presenter</span>
            </span>
          </div>
          <span className="logo-badge">STUDIO PRO</span>
        </div>

        {/* Live / Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 600,
          color: isConnected ? '#34d399' : '#f87171',
        }}>
          <Circle size={8} fill={isConnected ? '#10b981' : '#ef4444'} color="transparent" />
          <span>{isConnected ? 'LIVE SYNC ACTIVE' : 'RECONNECTING…'}</span>
        </div>
      </div>

      {/* Center: EasyWorship Live Panic & Control Buttons */}
      <div className="panic-bar">
        <button
          className={`panic-btn black ${liveState.isBlackout ? 'active' : ''}`}
          onClick={toggleBlackout}
          title="Instant Blackout: turns output black"
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
          BLACK
        </button>

        <button
          className={`panic-btn clear ${liveState.isClearText ? 'active' : ''}`}
          onClick={toggleClearText}
          title="Clear Text: hides lyrics/scripture while retaining background"
        >
          CLEAR
        </button>

        <button
          className={`panic-btn logo ${liveState.isLogo ? 'active' : ''}`}
          onClick={toggleLogo}
          title="Logo Mode: displays church logo / placeholder"
        >
          <ImageIcon size={13} />
          LOGO
        </button>

        <button
          className="btn"
          style={{
            background: liveState.quickAlert ? '#ef4444' : 'rgba(255, 255, 255, 0.06)',
            color: liveState.quickAlert ? '#ffffff' : '#94a3b8',
            fontSize: '12px',
            padding: '6px 12px',
          }}
          onClick={() => {
            setAlertText(liveState.quickAlert || '');
            setIsAlertModalOpen(true);
          }}
          title="Send instant nursery/pastor broadcast alert ticker"
        >
          <Bell size={13} />
          {liveState.quickAlert ? 'ALERT ACTIVE' : 'TICKER ALERT'}
        </button>
      </div>

      {/* Right: Output Windows & Library Drawer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          className="btn"
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(6, 182, 212, 0.25))',
            borderColor: 'rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            fontWeight: 700,
          }}
          onClick={onOpenOnlineSearch}
          title="Search song lyrics online and load directly into presentation & library"
        >
          <Search size={13} />
          Search Online Lyrics
        </button>

        <button 
          className="btn btn-primary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
          onClick={onOpenLibrary}
        >
          <BookOpen size={14} />
          Library
        </button>

        <div style={{ display: 'flex', gap: '4px' }}>
          <a
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ fontSize: '12px', padding: '6px 10px', textDecoration: 'none' }}
            title="Open Fullscreen Display in a new tab (for Projector / TV)"
          >
            <Tv size={13} />
            Display
            <ExternalLink size={11} style={{ opacity: 0.6 }} />
          </a>

          <a
            href="/display?overlay=1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ fontSize: '12px', padding: '6px 10px', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}
            title="Open vMix / OBS Alpha-channel broadcast overlay"
          >
            <Layers size={13} />
            vMix Overlay
            <ExternalLink size={11} style={{ opacity: 0.6 }} />
          </a>

          <a
            href="/stage"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ fontSize: '12px', padding: '6px 10px', textDecoration: 'none' }}
            title="Open Stage Confidence Monitor for singers & speaker"
          >
            <Mic2 size={13} />
            Stage
            <ExternalLink size={11} style={{ opacity: 0.6 }} />
          </a>
        </div>

        <button
          className="btn btn-icon"
          title="Reset to Default Presets & Demo Library"
          onClick={() => {
            if (window.confirm('Reset all styles, default schedules, and sample library to factory defaults?')) {
              onResetToDefault();
            }
          }}
          style={{ color: '#64748b' }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Quick Ticker / Alert Modal */}
      {isAlertModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAlertModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
                <Bell size={16} color="#ef4444" />
                Live Broadcast Ticker / Alert Banner
              </div>
              <button 
                className="btn btn-icon" 
                onClick={() => setIsAlertModalOpen(false)}
                style={{ background: 'transparent' }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleApplyAlert}>
              <div className="modal-body">
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.5 }}>
                  This will show a high-visibility emergency banner at the top of all live displays and vMix overlays (e.g. <em>"Nursery Alert: Child #402"</em>, <em>"Car Lights On: ABC-123"</em>).
                </p>
                <div className="form-group">
                  <label className="form-label">Alert Message</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter broadcast alert message..."
                    value={alertText}
                    onChange={e => setAlertText(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-footer">
                {liveState.quickAlert && (
                  <button type="button" className="btn btn-danger" onClick={handleClearAlert}>
                    Dismiss Active Alert
                  </button>
                )}
                <button type="button" className="btn" onClick={() => setIsAlertModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Broadcast Alert Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
