import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from '../types';
import { Maximize2, Minimize2, Tv, Circle } from 'lucide-react';

interface DisplayViewProps {
  state: AppState;
  progress: number;
  isOverlay?: boolean;
}

export const DisplayView: React.FC<DisplayViewProps> = ({
  state,
  progress,
  isOverlay = false,
}) => {
  const [fading, setFading] = useState(false);
  const [displayedLine, setDisplayedLine] = useState(state.lines[state.cur] || '');
  const [displayedNext, setDisplayedNext] = useState(state.lines[state.cur + 1] || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showHintToast, setShowHintToast] = useState(true);
  const [isMouseIdle, setIsMouseIdle] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check URL query parameters for overlay overrides
  const urlParams = new URLSearchParams(window.location.search);
  const queryOverlay = urlParams.get('overlay') === '1' || urlParams.get('transparent') === '1';
  const effectiveOverlay = isOverlay || queryOverlay || state.theme.bgType === 'transparent' || state.theme.displayMode === 'lower-third';

  // Track Fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle Fullscreen Edge-to-Edge
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Unable to toggle fullscreen:', err);
    }
  }, []);

  // Auto Fullscreen on mount & on first user gesture
  useEffect(() => {
    // 1. Try immediate auto fullscreen on mount
    const tryImmediate = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Browser requires user gesture; captured on first click below
      }
    };
    tryImmediate();

    // 2. Trigger fullscreen on first click or pointerdown anywhere
    const handleFirstGesture = async () => {
      if (!document.fullscreenElement) {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
    };
  }, []);

  // Keyboard Shortcuts ('F' for Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering if inside input/textarea
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  // Activity timer: auto-hide cursor & floating HUD after 2.5s of mouse inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    setIsMouseIdle(false);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
      setIsMouseIdle(true);
    }, 2500);
  }, []);

  // Auto-dismiss initial hint toast after 4s
  useEffect(() => {
    const toastTimer = setTimeout(() => {
      setShowHintToast(false);
    }, 4000);
    return () => clearTimeout(toastTimer);
  }, []);

  // Smooth slide change fade effect
  useEffect(() => {
    setFading(true);
    const timer = setTimeout(() => {
      setDisplayedLine(state.lines[state.cur] || '');
      setDisplayedNext(state.lines[state.cur + 1] || '');
      setFading(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [state.cur, state.lines]);

  const { theme, liveState } = state;

  // Background computation
  let bgStyle: React.CSSProperties = {};
  let bgClass = '';

  if (effectiveOverlay) {
    bgStyle = { background: 'transparent' };
  } else if (liveState.isBlackout) {
    bgStyle = { background: '#000000' };
  } else if (theme.bgType === 'solid') {
    bgStyle = { background: theme.bgColor };
  } else if (theme.bgType === 'animated-gradient') {
    bgStyle = {
      background: theme.bgGradient,
      backgroundSize: '240% 240%',
    };
    bgClass = 'ambient-gradient';
  } else {
    bgStyle = { background: theme.bgGradient };
  }

  // Text shadow & stroke styling
  const textShadowParts: string[] = [];
  if (theme.textShadow) {
    textShadowParts.push(`${theme.shadowOffsetX}px ${theme.shadowOffsetY}px ${theme.shadowBlur}px ${theme.shadowColor}`);
  }
  if (theme.textOutline) {
    const w = theme.outlineWidth;
    const oc = theme.outlineColor;
    textShadowParts.push(`-${w}px -${w}px 0 ${oc}, ${w}px -${w}px 0 ${oc}, -${w}px ${w}px 0 ${oc}, ${w}px ${w}px 0 ${oc}`);
  }

  const combinedTextShadow = textShadowParts.length > 0 ? textShadowParts.join(', ') : 'none';

  return (
    <div
      className={`display-canvas-root ${bgClass} ${isMouseIdle ? 'hide-cursor' : ''}`}
      onMouseMove={handleMouseMove}
      onDoubleClick={toggleFullscreen}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: effectiveOverlay || theme.displayMode === 'lower-third' ? 'flex-end' : 'center',
        alignItems: 'center',
        padding: effectiveOverlay || theme.displayMode === 'lower-third' ? '2.5rem 3rem' : '3rem 4rem',
        boxSizing: 'border-box',
        transition: 'background 0.5s ease',
        ...bgStyle,
      }}
    >
      {/* Floating Auto-Hiding Presentation HUD */}
      <div className={`display-hud-controls ${showControls ? 'visible' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, paddingRight: '4px' }}>
          <Circle size={8} fill="#10b981" color="transparent" />
          <span>LIVE DISPLAY</span>
        </div>

        <button
          className="display-hud-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          title={isFullscreen ? 'Exit Fullscreen (Esc or F)' : 'Enter Edge-to-Edge Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}</span>
        </button>
      </div>

      {/* Initial Hint Toast (fades after 4s) */}
      {showHintToast && !isFullscreen && (
        <div
          className="display-hint-toast"
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
        >
          <Tv size={14} color="#38bdf8" />
          <span>Click anywhere or press <strong>F</strong> for borderless full screen</span>
        </div>
      )}

      {/* Broadcast Quick Ticker Alert Banner */}
      {liveState.quickAlert && (
        <div className="quick-alert-banner">
          ⚠️ {liveState.quickAlert}
        </div>
      )}

      {/* Top Header Badge (Hidden in Overlay / Lower-Third) */}
      {!effectiveOverlay && theme.showReferenceBadge && !liveState.isBlackout && !liveState.isLogo && (
        <div style={{
          position: 'absolute',
          top: '2rem',
          left: '3rem',
          right: '3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: theme.fontFamily,
          fontSize: '13px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: theme.accentColor,
          fontWeight: 700,
          textShadow: '0 2px 8px rgba(0,0,0,0.7)',
        }}>
          <span>{state.title} {state.subtitle ? `• ${state.subtitle}` : ''}</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            {state.cur + 1} / {state.lines.length}
          </span>
        </div>
      )}

      {/* Emergency State: Logo Display */}
      {liveState.isLogo && !liveState.isBlackout && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          animation: 'fadeIn 0.5s ease',
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(245, 158, 11, 0.5)'
          }}>
            <span style={{ fontSize: '48px', color: '#ffffff' }}>✝</span>
          </div>
          <div style={{
            fontFamily: theme.fontFamily,
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#ffffff',
            textShadow: '0 4px 15px rgba(0,0,0,0.8)'
          }}>
            EASY PRESENTER
          </div>
        </div>
      )}

      {/* Main Slide Presentation Content */}
      {!liveState.isBlackout && !liveState.isLogo && !liveState.isClearText && (
        <div
          style={{
            maxWidth: '1280px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: theme.textAlign === 'left' ? 'flex-start' : theme.textAlign === 'right' ? 'flex-end' : 'center',
            textAlign: theme.textAlign,
            gap: '1.5rem',
            opacity: fading ? 0 : 1,
            transform: fading ? 'translateY(10px) scale(0.98)' : 'translateY(0) scale(1)',
            transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            ...(effectiveOverlay && {
              background: 'rgba(0, 0, 0, 0.45)',
              padding: '1.5rem 2.5rem',
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 10px 35px rgba(0, 0, 0, 0.7)',
            })
          }}
        >
          {/* Main Slide Text */}
          <div
            style={{
              fontFamily: theme.fontFamily,
              fontSize: `${theme.fontSize}px`,
              fontWeight: theme.fontWeight,
              fontStyle: theme.fontStyle,
              textTransform: theme.textTransform,
              color: theme.textColor,
              lineHeight: theme.lineHeight,
              letterSpacing: `${theme.letterSpacing}px`,
              textShadow: combinedTextShadow,
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
            }}
          >
            {displayedLine}
          </div>

          {/* Next Slide Preview (Subtle Prompt for Congregation / Singer) */}
          {theme.showNextPreview && displayedNext && (
            <div
              style={{
                fontFamily: theme.fontFamily,
                fontSize: `${Math.round(theme.fontSize * 0.45)}px`,
                fontWeight: 500,
                fontStyle: 'italic',
                color: 'rgba(255, 255, 255, 0.65)',
                textShadow: '0 2px 10px rgba(0,0,0,0.85)',
                maxWidth: '850px',
                marginTop: '0.25rem',
              }}
            >
              Next: {displayedNext.replace(/\n/g, ' ')}
            </div>
          )}
        </div>
      )}

      {/* Bottom Progress Bar (for Fullscreen mode) */}
      {!effectiveOverlay && theme.showProgressBar && !liveState.isBlackout && !liveState.isLogo && (
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          width: '100%',
          maxWidth: '640px',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${Math.round(progress * 100)}%`,
              background: theme.accentColor,
              borderRadius: '2px',
              transition: state.playing ? 'none' : 'width 0.2s ease',
              boxShadow: `0 0 10px ${theme.accentColor}`,
            }}
          />
        </div>
      )}
    </div>
  );
};

