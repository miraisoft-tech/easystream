import React, { useState } from 'react';
import { 
  ListOrdered, 
  Plus, 
  FolderDown, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Music, 
  BookOpen, 
  Sparkles, 
  FileText,
  Save,
  Check
} from 'lucide-react';
import { Schedule, ScheduleItem } from '../types';

interface SchedulePanelProps {
  schedule: ScheduleItem[];
  savedSchedules: Schedule[];
  currentScheduleId: string | null;
  activeScheduleIndex: number;
  onLoadScheduleItem: (index: number) => void;
  onUpdateSchedule: (items: ScheduleItem[]) => void;
  onSaveSchedule: (schedule: Schedule) => void;
  onLoadSchedule: (scheduleId: string) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onOpenLibrary: () => void;
}

export const SchedulePanel: React.FC<SchedulePanelProps> = ({
  schedule,
  savedSchedules,
  currentScheduleId,
  activeScheduleIndex,
  onLoadScheduleItem,
  onUpdateSchedule,
  onSaveSchedule,
  onLoadSchedule,
  onDeleteSchedule,
  onOpenLibrary,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleNameInput, setScheduleNameInput] = useState('');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const currentSchedule = savedSchedules.find(s => s.id === currentScheduleId);

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= schedule.length) return;
    
    const newItems = [...schedule];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    onUpdateSchedule(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = schedule.filter((_, i) => i !== index);
    onUpdateSchedule(newItems);
  };

  const handleSaveCurrentSchedule = () => {
    const scheduleId = currentScheduleId || `schedule-${Date.now()}`;
    const name = scheduleNameInput.trim() || currentSchedule?.name || 'Sunday Service Set';
    
    const newSchedule: Schedule = {
      id: scheduleId,
      name,
      items: schedule,
      createdAt: currentSchedule?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    
    onSaveSchedule(newSchedule);
    setIsSaving(false);
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const handleNewSchedule = () => {
    const name = prompt('Enter name for new service set:', 'New Service Set');
    if (!name) return;
    
    const newSchedule: Schedule = {
      id: `schedule-${Date.now()}`,
      name,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onSaveSchedule(newSchedule);
    onLoadSchedule(newSchedule.id);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedSchedules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `worship_schedules_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getItemIcon = (category?: string) => {
    switch (category) {
      case 'song': return <Music size={14} color="#38bdf8" />;
      case 'hymn': return <Sparkles size={14} color="#f59e0b" />;
      case 'scripture': return <BookOpen size={14} color="#10b981" />;
      default: return <FileText size={14} color="#94a3b8" />;
    }
  };

  return (
    <aside className="studio-column">
      {/* Schedule Header */}
      <div className="column-header">
        <div className="column-title">
          <ListOrdered size={14} color="#38bdf8" />
          Service Schedule
        </div>
        <button 
          className="btn btn-icon" 
          onClick={onOpenLibrary}
          title="Add song or scripture from library"
          style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Schedule Set Selector & Save controls */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(9, 13, 20, 0.4)' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <select
            className="form-select"
            value={currentScheduleId || ''}
            onChange={(e) => onLoadSchedule(e.target.value)}
            style={{ fontSize: '12px', padding: '6px 8px' }}
          >
            {savedSchedules.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.items.length} items)
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={handleNewSchedule}
              title="Create a new empty service schedule"
            >
              <Plus size={11} /> New
            </button>
            <button
              className="btn"
              style={{ fontSize: '11px', padding: '4px 8px', background: showSavedFeedback ? '#10b981' : undefined }}
              onClick={() => {
                setScheduleNameInput(currentSchedule?.name || 'Sunday Service');
                setIsSaving(true);
              }}
              title="Save current schedule"
            >
              {showSavedFeedback ? <Check size={11} /> : <Save size={11} />}
              {showSavedFeedback ? 'Saved!' : 'Save'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn"
              style={{ fontSize: '11px', padding: '4px 6px', color: '#64748b' }}
              onClick={handleExportJson}
              title="Export schedules as JSON backup"
            >
              <FolderDown size={12} />
            </button>
            {savedSchedules.length > 1 && currentScheduleId && (
              <button
                className="btn btn-danger"
                style={{ fontSize: '11px', padding: '4px 6px' }}
                onClick={() => {
                  if (confirm(`Delete schedule "${currentSchedule?.name}"?`)) {
                    onDeleteSchedule(currentScheduleId);
                  }
                }}
                title="Delete this schedule set"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {isSaving && (
          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(30, 41, 59, 0.9)', borderRadius: '6px' }}>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '12px', padding: '5px 8px', marginBottom: '6px' }}
              value={scheduleNameInput}
              onChange={(e) => setScheduleNameInput(e.target.value)}
              placeholder="Schedule name..."
              autoFocus
            />
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => setIsSaving(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={handleSaveCurrentSchedule}>
                Confirm Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Items List */}
      <div className="column-content">
        {schedule.length === 0 ? (
          <div style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ListOrdered size={28} style={{ opacity: 0.4 }} />
            <span>Schedule is currently empty.</span>
            <button className="btn btn-primary" style={{ fontSize: '11px', marginTop: '4px' }} onClick={onOpenLibrary}>
              <Plus size={12} /> Add from Library
            </button>
          </div>
        ) : (
          schedule.map((item, idx) => {
            const isActive = idx === activeScheduleIndex;
            return (
              <div
                key={item.id || idx}
                className={`interactive-card ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '8px 10px',
                }}
                onClick={() => onLoadScheduleItem(idx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isActive ? '#38bdf8' : '#64748b',
                    width: '16px'
                  }}>
                    {idx + 1}.
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                    {getItemIcon(item.category)}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#ffffff' : '#e2e8f0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {item.lines.length} slide{item.lines.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Move & Delete controls */}
                <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
                  <button
                    className="btn btn-icon"
                    style={{ width: '22px', height: '22px', background: 'transparent' }}
                    onClick={() => handleMoveItem(idx, 'up')}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    className="btn btn-icon"
                    style={{ width: '22px', height: '22px', background: 'transparent' }}
                    onClick={() => handleMoveItem(idx, 'down')}
                    disabled={idx === schedule.length - 1}
                    title="Move down"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    className="btn btn-icon btn-danger"
                    style={{ width: '22px', height: '22px' }}
                    onClick={() => handleRemoveItem(idx)}
                    title="Remove from schedule"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
