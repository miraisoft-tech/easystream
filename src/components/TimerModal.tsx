import React, { useState, useEffect } from 'react';
import { TimerState } from '../types';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  Send, 
  EyeOff, 
  ExternalLink, 
  AlertTriangle, 
  Layers, 
  Tv, 
  MessageSquare,
  Sparkles,
  Check
} from 'lucide-react';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timerState: TimerState;
  onStartTimer: (durationSec?: number, title?: string) => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onAdjustTimer: (deltaSec: number) => void;
  onSetTimerConfig: (config: Partial<TimerState>) => void;
  onSetTimerPrompt: (message: string | null, visible: boolean) => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({
  isOpen,
  onClose,
  timerState,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onAdjustTimer,
  onSetTimerConfig,
  onSetTimerPrompt,
}) => {
  const [customMins, setCustomMins] = useState(Math.round(timerState.durationSec / 60));
  const [titleInput, setTitleInput] = useState(timerState.title);
  const [promptInput, setPromptInput] = useState(timerState.promptMessage || '');
  const [targetTimeStr, setTargetTimeStr] = useState('');
  const [now, setNow] = useState(Date.now());

  // Update live preview ticking
  useEffect(() => {
    if (!isOpen) return;
    const update = () => setNow(Date.now());
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    setTitleInput(timerState.title);
  }, [timerState.title]);

  useEffect(() => {
    if (timerState.promptMessage) {
      setPromptInput(timerState.promptMessage);
    }
  }, [timerState.promptMessage]);

  if (!isOpen) return null;

  // Calculate live remaining seconds
  let currentSec = timerState.remainingSec;
  if (timerState.status === 'running' && timerState.targetEndTime) {
    currentSec = Math.floor((timerState.targetEndTime - now) / 1000);
  }

  const isOvertime = currentSec < 0;
  const absSec = Math.abs(currentSec);

  const formatDisplayTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    let str = hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
    if (isOvertime) str = `-${str}`;
    return str;
  };

  const handleApplyPreset = (minutes: number) => {
    setCustomMins(minutes);
    const sec = minutes * 60;
    onSetTimerConfig({ durationSec: sec, remainingSec: sec });
    if (timerState.status === 'idle') {
      onStartTimer(sec, titleInput);
    }
  };

  const handleApplyCustomDuration = () => {
    const sec = Math.max(10, customMins * 60);
    onSetTimerConfig({ durationSec: sec, remainingSec: sec, title: titleInput });
  };

  // Schedule to end at specific time of day (e.g. 11:30 AM)
  const handleScheduleTargetTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTimeStr) return;

    const [hrs, mins] = targetTimeStr.split(':').map(Number);
    if (isNaN(hrs) || isNaN(mins)) return;

    const targetDate = new Date();
    targetDate.setHours(hrs, mins, 0, 0);

    // If target time is earlier today, assume next service or add 24h
    let diffMs = targetDate.getTime() - Date.now();
    if (diffMs <= 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const durationSec = Math.round(diffMs / 1000);
    setCustomMins(Math.round(durationSec / 60));
    onSetTimerConfig({
      durationSec,
      remainingSec: durationSec,
      title: titleInput || 'Scheduled Countdown',
    });
    onStartTimer(durationSec, titleInput || 'Scheduled Countdown');
  };

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim()) return;
    onSetTimerPrompt(promptInput.trim(), true);
  };

  const handleDismissPrompt = () => {
    onSetTimerPrompt(null, false);
    setPromptInput('');
  };

  const QUICK_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90];
  const QUICK_PROMPTS = [
    '2 Minutes Remaining',
    'Please Wrap Up Sermon',
    'Time Up — Conclude',
    'Standby for Offering',
    'Worship Team to Stage',
    'Welcome! Service Starts Soon',
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(14, 165, 233, 0.4)'
            }}>
              <Clock size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#f8fafc' }}>
                Countdown & Overtime Timer Studio
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Synchronized stage confidence monitor, podium clock & vMix overlays
              </div>
            </div>
          </div>
          <button 
            className="btn btn-icon" 
            onClick={onClose}
            style={{ background: 'transparent', color: '#94a3b8' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top Live Timer Card */}
          <div style={{
            background: isOvertime 
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.9))'
              : 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(15, 23, 42, 0.9))',
            border: `1px solid ${isOvertime ? 'rgba(239, 68, 68, 0.4)' : 'rgba(14, 165, 233, 0.3)'}`,
            borderRadius: '16px',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  background: isOvertime
                    ? '#ef4444'
                    : timerState.status === 'running'
                      ? '#10b981'
                      : timerState.status === 'paused'
                        ? '#f59e0b'
                        : '#64748b',
                  color: 'white',
                  textTransform: 'uppercase'
                }}>
                  {isOvertime ? 'OVERTIME' : timerState.status}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>
                  {timerState.title}
                </span>
              </div>

              {/* Big Live Digits */}
              <div style={{
                fontSize: '44px',
                fontWeight: 900,
                fontFamily: '"JetBrains Mono", monospace',
                color: isOvertime ? '#ef4444' : timerState.status === 'running' ? '#38bdf8' : '#f8fafc',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.1,
              }}>
                {formatDisplayTime(absSec)}
              </div>
            </div>

            {/* Direct Open Window Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <a
                href="/timer"
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
              >
                <Tv size={13} /> Open Timer Display
                <ExternalLink size={11} />
              </a>

              <a
                href="/timer?overlay=1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' }}
              >
                <Layers size={13} /> vMix Transparent Overlay
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Transport Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px',
          }}>
            {timerState.status === 'running' ? (
              <button
                className="btn btn-warning"
                onClick={onPauseTimer}
                style={{ fontSize: '14px', padding: '10px 24px', fontWeight: 800, gap: '8px' }}
              >
                <Pause size={16} /> Pause Timer
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={() => onStartTimer(undefined, titleInput)}
                style={{ fontSize: '14px', padding: '10px 28px', fontWeight: 800, gap: '8px', background: '#10b981', color: 'white' }}
              >
                <Play size={16} fill="white" /> {timerState.status === 'paused' ? 'Resume Timer' : 'Start Countdown'}
              </button>
            )}

            <button
              className="btn"
              onClick={onResetTimer}
              style={{ fontSize: '13px', padding: '10px 18px', gap: '6px' }}
              title="Reset to initial duration"
            >
              <RotateCcw size={15} /> Reset
            </button>

            <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }} />

            {/* Quick Nudges */}
            <button
              className="btn btn-icon"
              onClick={() => onAdjustTimer(-60)}
              title="Subtract 1 minute"
              style={{ width: '36px', height: '36px' }}
            >
              -1m
            </button>
            <button
              className="btn btn-icon"
              onClick={() => onAdjustTimer(60)}
              title="Add 1 minute"
              style={{ width: '36px', height: '36px' }}
            >
              +1m
            </button>
            <button
              className="btn btn-icon"
              onClick={() => onAdjustTimer(300)}
              title="Add 5 minutes"
              style={{ width: '36px', height: '36px', color: '#38bdf8' }}
            >
              +5m
            </button>
          </div>

          {/* Preset Durations */}
          <div>
            <label className="form-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#f59e0b" />
              Quick Countdown Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {QUICK_PRESETS.map((mins) => {
                const isActive = Math.round(timerState.durationSec / 60) === mins;
                return (
                  <button
                    key={mins}
                    className={`btn ${isActive ? 'btn-primary' : ''}`}
                    style={{
                      fontSize: '13px',
                      padding: '8px 12px',
                      fontWeight: 700,
                      justifyContent: 'center',
                      background: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                    }}
                    onClick={() => handleApplyPreset(mins)}
                  >
                    {mins} Min
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Duration & Schedule Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '14px',
          }}>
            {/* Custom Minutes Input */}
            <div>
              <label className="form-label">Custom Duration (Minutes)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="1"
                  max="300"
                  className="form-input"
                  value={customMins}
                  onChange={e => setCustomMins(Number(e.target.value))}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyCustomDuration}
                  style={{ flexShrink: 0, padding: '0 14px' }}
                >
                  Set
                </button>
              </div>
            </div>

            {/* Target Schedule Time of Day */}
            <form onSubmit={handleScheduleTargetTime}>
              <label className="form-label">Target Schedule End Time</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="time"
                  className="form-input"
                  value={targetTimeStr}
                  onChange={e => setTargetTimeStr(e.target.value)}
                  placeholder="e.g. 11:30"
                />
                <button
                  type="submit"
                  className="btn"
                  style={{ flexShrink: 0, padding: '0 14px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}
                  disabled={!targetTimeStr}
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>

          {/* Title and Overtime Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="form-label">Timer Title / Session Name</label>
              <input
                type="text"
                className="form-input"
                value={titleInput}
                onChange={e => {
                  setTitleInput(e.target.value);
                  onSetTimerConfig({ title: e.target.value });
                }}
                placeholder="e.g. Sermon, Worship Set, Service Countdown"
              />
            </div>

            <div>
              <label className="form-label">Warning Threshold</label>
              <select
                className="form-input"
                value={timerState.warningThresholdSec}
                onChange={e => onSetTimerConfig({ warningThresholdSec: Number(e.target.value) })}
              >
                <option value={60}>1 Minute</option>
                <option value={180}>3 Minutes</option>
                <option value={300}>5 Minutes (Recommended)</option>
                <option value={600}>10 Minutes</option>
              </select>
            </div>
          </div>

          {/* Overtime Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '10px 16px',
            borderRadius: '10px',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                Overtime Count-Up
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                When reaching 00:00, show "TIME UP" and count up elapsed negative time
              </div>
            </div>
            <input
              type="checkbox"
              checked={timerState.allowOvertime}
              onChange={e => onSetTimerConfig({ allowOvertime: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
            />
          </div>

          {/* SECTION: Slide-Below Prompt Message Broadcaster */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} color="#f59e0b" />
                Stage Prompt Message (Slides Below Display)
              </label>
              {timerState.promptVisible && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}>
                  ● LIVE ON DISPLAY
                </span>
              )}
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
              Sends a real-time prompt message that smoothly slides up from the bottom of the confidence timer screen for the speaker.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Pastor: 2 minutes left, wrap up sermon..."
                value={promptInput}
                onChange={e => setPromptInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendPrompt();
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSendPrompt()}
                style={{ flexShrink: 0, gap: '6px' }}
                disabled={!promptInput.trim()}
              >
                <Send size={13} /> Send Prompt
              </button>
              {timerState.promptVisible && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDismissPrompt}
                  style={{ flexShrink: 0, gap: '6px' }}
                >
                  <EyeOff size={13} /> Dismiss
                </button>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_PROMPTS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="btn"
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: promptInput === chip ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: promptInput === chip ? '#f59e0b' : '#94a3b8',
                    borderColor: promptInput === chip ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                  }}
                  onClick={() => {
                    setPromptInput(chip);
                    onSetTimerPrompt(chip, true);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
