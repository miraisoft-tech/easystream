import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, Trash2, X, Check, ShieldAlert } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId: string;
  onResetCurrentSession: () => void;
  onResetAllSessions: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  currentSessionId,
  onResetCurrentSession,
  onResetAllSessions,
}) => {
  const [selectedMode, setSelectedMode] = useState<'current' | 'all'>('current');
  const [isConfirming, setIsConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteReset = () => {
    setIsConfirming(true);
    if (selectedMode === 'all') {
      onResetAllSessions();
      setSuccessMessage('All sessions have been cleared and app restored to default data.');
    } else {
      onResetCurrentSession();
      setSuccessMessage(`Session "${currentSessionId}" has been reset to defaults.`);
    }

    setTimeout(() => {
      setIsConfirming(false);
      setSuccessMessage(null);
      onClose();
    }, 1200);
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
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0f1422, #080c14)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '20px',
          width: 'min(540px, 94vw)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 40px rgba(239, 68, 68, 0.15)',
          color: '#ffffff',
          padding: '2rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
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

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Reset & Restore Defaults
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Choose whether to reset your active room or completely purge all session data.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '1.25rem',
              color: '#10b981',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Option Selection Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.75rem' }}>
          {/* Option 1: Reset Current Session */}
          <div
            onClick={() => setSelectedMode('current')}
            style={{
              background:
                selectedMode === 'current' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border:
                selectedMode === 'current'
                  ? '2px solid #38bdf8'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={16} color="#38bdf8" />
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#f8fafc' }}>
                  Reset Current Session Only ({currentSessionId})
                </span>
              </div>
              <input
                type="radio"
                name="reset-option"
                checked={selectedMode === 'current'}
                onChange={() => setSelectedMode('current')}
                style={{ accentColor: '#38bdf8' }}
              />
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, paddingLeft: '24px' }}>
              Resets schedule, themes, countdown timer, and slide presets for room <strong style={{ color: '#38bdf8' }}>"{currentSessionId}"</strong>. Other saved sessions remain untouched.
            </p>
          </div>

          {/* Option 2: Clear All Sessions & Factory Reset */}
          <div
            onClick={() => setSelectedMode('all')}
            style={{
              background:
                selectedMode === 'all' ? 'rgba(239, 68, 68, 0.14)' : 'rgba(255, 255, 255, 0.03)',
              border:
                selectedMode === 'all'
                  ? '2px solid #ef4444'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={16} color="#ef4444" />
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#f87171' }}>
                  Clear All Sessions & Factory Reset
                </span>
              </div>
              <input
                type="radio"
                name="reset-option"
                checked={selectedMode === 'all'}
                onChange={() => setSelectedMode('all')}
                style={{ accentColor: '#ef4444' }}
              />
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, paddingLeft: '24px' }}>
              <strong style={{ color: '#ef4444' }}>Full Purge:</strong> Deletes all custom sessions, wipes browser local storage, resets server data to default scriptures, songs, schedules & themes, and switches to default session.
            </p>
          </div>
        </div>

        {/* Warning Notice */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '1.5rem',
            fontSize: '12px',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>
            {selectedMode === 'all'
              ? 'This action cannot be undone. All custom schedules and saved sessions will be erased.'
              : 'The current active presentation state and timer will be returned to initial sample presets.'}
          </span>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn"
            style={{ padding: '8px 18px', fontSize: '13px' }}
            onClick={onClose}
            disabled={isConfirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${selectedMode === 'all' ? 'btn-danger' : 'btn-primary'}`}
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={handleExecuteReset}
            disabled={isConfirming}
          >
            {selectedMode === 'all' ? <Trash2 size={14} /> : <RotateCcw size={14} />}
            {isConfirming
              ? 'Resetting...'
              : selectedMode === 'all'
                ? 'Clear Everything & Reset'
                : 'Reset Current Session'}
          </button>
        </div>
      </div>
    </div>
  );
};
