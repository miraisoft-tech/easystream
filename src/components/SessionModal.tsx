import React, { useState, useEffect } from 'react';
import { Radio, Layers, Save, Trash2, Check, ArrowRight, X, Sparkles } from 'lucide-react';
import { SessionMeta } from '../types';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId: string;
  onSwitchSession: (sessionId: string) => void;
  onSaveSession: (sessionName?: string) => void;
  isStartupPrompt?: boolean;
}

const SAVED_SESSIONS_KEY = 'easystream_saved_sessions_list';

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  currentSessionId,
  onSwitchSession,
  onSaveSession,
  isStartupPrompt = false,
}) => {
  const [sessionInput, setSessionInput] = useState('');
  const [sessionNameInput, setSessionNameInput] = useState('');
  const [savedSessions, setSavedSessions] = useState<SessionMeta[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Load saved sessions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_SESSIONS_KEY);
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      } else {
        setSavedSessions([
          { id: 'default', name: 'Main Sanctuary / Default', updatedAt: Date.now() },
        ]);
      }
    } catch {
      setSavedSessions([{ id: 'default', name: 'Main Sanctuary / Default', updatedAt: Date.now() }]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleJoinSession = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = (sessionInput.trim().toLowerCase() || 'default').replace(/[^a-z0-9-_]/g, '-');
    onSwitchSession(cleanId);
    setSessionInput('');
    onClose();
  };

  const handleSelectSession = (id: string) => {
    onSwitchSession(id);
    onClose();
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSession(sessionNameInput.trim() || currentSessionId);
    setSaveSuccessMessage(`Session "${currentSessionId}" saved successfully!`);

    // Reload list
    try {
      const stored = localStorage.getItem(SAVED_SESSIONS_KEY);
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      }
    } catch {}

    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 2500);
  };

  const handleDeleteSavedSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'default') return;
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    try {
      localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(updated));
    } catch {}
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 5, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={() => !isStartupPrompt && onClose()}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0c121e, #070b13)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '20px',
          width: 'min(580px, 94vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.15)',
          color: '#ffffff',
          padding: '2rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button if not mandatory startup prompt */}
        {!isStartupPrompt && (
          <button
            type="button"
            className="btn btn-icon"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
            flexShrink: 0,
          }}>
            <Radio size={24} color="#05070c" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              {isStartupPrompt ? 'Choose or Create Session' : 'Session Manager'}
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Current Active Session: <strong style={{ color: '#38bdf8' }}>{currentSessionId}</strong>
            </p>
          </div>
        </div>

        {/* Success toast */}
        {saveSuccessMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '1.25rem',
            color: '#10b981',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Enter / Join Session Form */}
        <form onSubmit={handleJoinSession} style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#38bdf8" />
            Enter Session ID / Room Name
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, padding: '10px 14px', fontSize: '14px', background: 'rgba(255, 255, 255, 0.05)' }}
              placeholder="e.g. main-service, youth-hall, rehearsal"
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              autoFocus={isStartupPrompt}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0 18px', fontWeight: 800, fontSize: '13px', gap: '6px' }}
            >
              Connect <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            All displays, stage monitors, and operators using this Session ID will synchronize together in real-time.
          </div>
        </form>

        {/* Saved / Recent Sessions List */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="#f59e0b" />
            Saved & Recent Sessions
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {savedSessions.map((s) => {
              const isCurrent = s.id === currentSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  style={{
                    background: isCurrent ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: isCurrent ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: isCurrent ? '#38bdf8' : '#e2e8f0' }}>
                        {s.id}
                      </span>
                      {isCurrent && (
                        <span style={{ background: '#0284c7', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    {s.name && s.name !== s.id && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        {s.name}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {s.id !== 'default' && (
                      <button
                        type="button"
                        className="btn btn-icon"
                        onClick={(e) => handleDeleteSavedSession(s.id, e)}
                        style={{ width: '28px', height: '28px', color: '#ef4444' }}
                        title="Delete saved session reference"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className={`btn ${isCurrent ? 'btn-primary' : ''}`}
                      style={{ fontSize: '11px', padding: '4px 10px', fontWeight: 700 }}
                    >
                      {isCurrent ? 'Selected' : 'Switch'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Current Session Form */}
        <form onSubmit={handleSaveCurrent} style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '14px',
          padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={13} color="#10b981" /> Save Current Session
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {currentSessionId}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
              placeholder="Session display name / notes (optional)"
              value={sessionNameInput}
              onChange={(e) => setSessionNameInput(e.target.value)}
            />
            <button
              type="submit"
              className="btn"
              style={{ padding: '0 14px', fontSize: '12px', fontWeight: 700, borderColor: '#10b981', color: '#10b981' }}
            >
              <Save size={13} /> Save
            </button>
          </div>
        </form>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem' }}>
          {isStartupPrompt ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '8px 20px', fontWeight: 800, fontSize: '13px' }}
              onClick={() => handleSelectSession(currentSessionId || 'default')}
            >
              Continue to Studio <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              style={{ padding: '8px 18px', fontSize: '13px' }}
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
