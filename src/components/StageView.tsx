import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { Clock, Mic2 } from 'lucide-react';

interface StageViewProps {
  state: AppState;
  progress: number;
}

export const StageView: React.FC<StageViewProps> = ({ state, progress }) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentLine = state.lines[state.cur] || '';
  const nextLine = state.lines[state.cur + 1] || '';

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000000',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      padding: '2rem 3rem',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Alert Banner if active */}
      {state.liveState.quickAlert && (
        <div style={{
          background: '#ef4444',
          color: 'white',
          padding: '12px 20px',
          fontWeight: 800,
          fontSize: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '1rem',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.6)'
        }}>
          ⚠️ {state.liveState.quickAlert}
        </div>
      )}

      {/* Top Header: Title, Slide Index, Clock */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#3b82f6',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '13px',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Mic2 size={15} /> STAGE MONITOR
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>
            {state.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#f59e0b' }}>
            Slide {state.cur + 1} of {state.lines.length}
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '24px',
            fontWeight: 800,
            color: '#38bdf8',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <Clock size={20} />
            {timeStr}
          </div>
        </div>
      </div>

      {/* Center: Current Line (High Contrast, Big) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '2rem 0',
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#38bdf8',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Current Line (On Screen):
        </div>
        <div style={{
          fontSize: 'clamp(36px, 5.5vw, 64px)',
          fontWeight: 800,
          lineHeight: 1.35,
          color: state.liveState.isClearText ? '#64748b' : '#ffffff',
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',
        }}>
          {state.liveState.isClearText ? '(Screen Text Cleared)' : currentLine}
        </div>
      </div>

      {/* Bottom: Next Line Preview + Timer Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '1.25rem 1.75rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Next Slide:
          </span>
          {state.playing && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>
              Auto-advancing ({Math.round(progress * 100)}%)
            </span>
          )}
        </div>
        <div style={{
          fontSize: 'clamp(20px, 3vw, 32px)',
          fontWeight: 600,
          color: '#94a3b8',
          lineHeight: 1.4,
          whiteSpace: 'pre-line',
        }}>
          {nextLine || '(End of current song/scripture)'}
        </div>

        {/* Progress bar */}
        {state.playing && (
          <div style={{
            height: '6px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            marginTop: '1rem',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.round(progress * 100)}%`,
              background: '#f59e0b',
            }} />
          </div>
        )}
      </div>
    </div>
  );
};
