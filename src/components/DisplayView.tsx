import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from '../types';
import { Maximize2, Minimize2, Tv, Circle, AlertTriangle, BookOpen } from 'lucide-react';

interface DisplayViewProps {
  state: AppState;
  progress: number;
  isOverlay?: boolean;
}

export const DisplayView: React.FC<DisplayViewProps> = ({
  state,
  progress: _progress,
  isOverlay = false,
}) => {
  const [fading, setFading] = useState(false);
  const [displayedLine, setDisplayedLine] = useState(state.lines[state.cur] || '');
  const [displayedNext, setDisplayedNext] = useState(state.lines[state.cur + 1] || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showHintToast, setShowHintToast] = useState(true);
  const [isMouseIdle, setIsMouseIdle] = useState(false);
  const [now, setNow] = useState(Date.now());
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep live time ticking for countdown and real-world clock
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Check URL query parameters for overlay, timer, clock overrides
  const urlParams = new URLSearchParams(window.location.search);
  const queryOverlay = urlParams.get('overlay') === '1' || urlParams.get('transparent') === '1';
  const effectiveOverlay = isOverlay || queryOverlay || state.theme.bgType === 'transparent' || state.theme.displayMode === 'lower-third';

  // Timer & Clock URL parameter overrides
  const queryTimer = urlParams.get('timer');
  const queryClock = urlParams.get('clock');

  const { timerState, theme, liveState } = state;

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
    const tryImmediate = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {}
    };
    tryImmediate();

    const handleFirstGesture = async () => {
      if (!document.fullscreenElement) {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch {}
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

  // -------------------------------------------------------------
  // Live Timer & Real-World Clock Calculations
  // -------------------------------------------------------------
  const showTimerWidget =
    queryTimer !== null
      ? queryTimer === '1' || queryTimer === 'true'
      : (timerState.showOnDisplay ?? true) && (timerState.status !== 'idle' || timerState.remainingSec > 0);

  const showClockWidget =
    queryClock !== null
      ? queryClock === '1' || queryClock === 'true'
      : (timerState.showClockOnDisplay ?? true);

  // Compute live remaining timer seconds
  let currentTimerSec = timerState.remainingSec;
  if (timerState.status === 'running' && timerState.targetEndTime) {
    currentTimerSec = Math.floor((timerState.targetEndTime - now) / 1000);
  }

  const isOvertime = currentTimerSec < 0;
  const isCritical = currentTimerSec <= timerState.criticalThresholdSec && !isOvertime;
  const isWarning = currentTimerSec <= timerState.warningThresholdSec && !isCritical && !isOvertime;

  const absSec = Math.abs(currentTimerSec);
  const timerHours = Math.floor(absSec / 3600);
  const timerMins = Math.floor((absSec % 3600) / 60);
  const timerSecs = absSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const formattedTimerStr =
    timerHours > 0
      ? `${isOvertime ? '-' : ''}${timerHours}:${pad(timerMins)}:${pad(timerSecs)}`
      : `${isOvertime ? '-' : ''}${timerMins}:${pad(timerSecs)}`;

  // Format real-world clock time (e.g. 20:57)
  const realClockDate = new Date(now);
  const clockHours = realClockDate.getHours().toString().padStart(2, '0');
  const clockMinutes = realClockDate.getMinutes().toString().padStart(2, '0');
  const formattedClockTime = `${clockHours}:${clockMinutes}`;

  const isScriptureCategory = state.category === 'scripture';
  const effectiveFontSize = isScriptureCategory
    ? Math.max(theme.fontSize, 50)
    : theme.fontSize;

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
        justifyContent: 'center',
        alignItems: 'center',
        padding: effectiveOverlay || theme.displayMode === 'lower-third' ? '2.5rem 3rem' : '4rem 5rem',
        boxSizing: 'border-box',
        transition: 'background 0.5s ease',
        ...bgStyle,
      }}
    >
      {/* Floating Auto-Hiding Presentation HUD (for operator) */}
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

      {/* Live Prompt Message Banner */}
      {timerState.promptVisible && timerState.promptMessage && !liveState.isBlackout && (
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(234, 88, 12, 0.95))',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '999px',
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.5), 0 0 20px rgba(0, 0, 0, 0.6)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <AlertTriangle size={20} />
          <span>{timerState.promptMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER: BIGGER RED TIMER COUNT (LEFT) + BIGGER CLOCK (RIGHT) */}
      {/* ------------------------------------------------------------- */}
      {!liveState.isBlackout && (
        <div
          style={{
            position: 'absolute',
            top: '2.5rem',
            left: '3.5rem',
            right: '3.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            zIndex: 45,
            pointerEvents: 'none',
          }}
        >
          {/* Top Left: Extra-Big Timer Count with Overtime Badge */}
          {showTimerWidget ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              {/* Overtime indicator badge */}
              {isOvertime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 900,
                      letterSpacing: '0.12em',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      boxShadow: '0 0 15px rgba(239, 68, 68, 0.8)',
                      textTransform: 'uppercase',
                    }}
                  >
                    OVERTIME
                  </span>
                  {timerState.title && (
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase' }}>
                      {timerState.title}
                    </span>
                  )}
                </div>
              )}

              <div
                style={{
                  fontFamily: 'Montserrat, "Outfit", sans-serif',
                  fontSize: 'clamp(56px, 7vw, 98px)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  color: isOvertime
                    ? '#ef4444'
                    : isCritical
                      ? '#f97316'
                      : isWarning
                        ? '#f59e0b'
                        : '#ffffff',
                  textShadow: isOvertime
                    ? '0 0 40px rgba(239, 68, 68, 0.9), 0 4px 15px rgba(0, 0, 0, 0.95)'
                    : '0 4px 25px rgba(0, 0, 0, 0.85)',
                  transition: 'color 0.3s ease',
                }}
              >
                {formattedTimerStr}
              </div>

              {!isOvertime && timerState.title && (
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(255, 255, 255, 0.75)',
                    marginTop: '4px',
                  }}
                >
                  {timerState.title}
                </span>
              )}
            </div>
          ) : <div />}

          {/* Top Right: Extra-Big Digital Real-World Clock (e.g. 20:57) */}
          {showClockWidget ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  fontFamily: 'Montserrat, "Outfit", sans-serif',
                  fontSize: 'clamp(56px, 7vw, 98px)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  color: '#ffffff',
                  textShadow: '0 4px 25px rgba(0, 0, 0, 0.85), 0 0 35px rgba(255, 255, 255, 0.35)',
                }}
              >
                {formattedClockTime}
              </div>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Emergency State: Logo Display */}
      {liveState.isLogo && !liveState.isBlackout && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            animation: 'fadeIn 0.5s ease',
          }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(245, 158, 11, 0.5)',
            }}
          >
            <span style={{ fontSize: '48px', color: '#ffffff' }}>✝</span>
          </div>
          <div
            style={{
              fontFamily: theme.fontFamily,
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#ffffff',
              textShadow: '0 4px 15px rgba(0,0,0,0.8)',
            }}
          >
            EASY PRESENTER
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN SLIDE CONTENT: BIG CENTERED SCRIPTURE PASSAGE & CITATION */}
      {/* ------------------------------------------------------------- */}
      {!liveState.isBlackout && !liveState.isLogo && !liveState.isClearText && (
        <div
          style={{
            maxWidth: '1440px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isScriptureCategory ? 'center' : (theme.textAlign === 'left' ? 'flex-start' : theme.textAlign === 'right' ? 'flex-end' : 'center'),
            textAlign: isScriptureCategory ? 'center' : theme.textAlign,
            gap: '1.5rem',
            opacity: fading ? 0 : 1,
            transform: fading ? 'translateY(10px) scale(0.98)' : 'translateY(0) scale(1)',
            transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            padding: '2rem 1rem',
            ...(effectiveOverlay && {
              background: 'rgba(0, 0, 0, 0.65)',
              padding: '2rem 3rem',
              borderRadius: '20px',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
            }),
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
                maxWidth: '900px',
                marginTop: '0.25rem',
              }}
            >
              Next: {displayedNext.replace(/\n/g, ' ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
