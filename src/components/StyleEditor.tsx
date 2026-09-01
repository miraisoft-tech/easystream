import React from 'react';
import { 
  Type, 
  Palette, 
  Sliders, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Sparkles, 
  Tv, 
  Eye,
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import { PresentationTheme } from '../types';
import { THEME_PRESETS } from '../data/defaults';

interface StyleEditorProps {
  theme: PresentationTheme;
  onUpdateTheme: (theme: Partial<PresentationTheme>) => void;
}

const FONT_FAMILIES = [
  { label: 'Montserrat (Modern Bold)', value: 'Montserrat, sans-serif' },
  { label: 'Outfit (Clean Geometric)', value: 'Outfit, sans-serif' },
  { label: 'Inter (Crisp Display)', value: 'Inter, sans-serif' },
  { label: 'Playfair Display (Classic Serif)', value: 'Playfair Display, serif' },
  { label: 'Cinzel (Majestic Traditional)', value: 'Cinzel, serif' },
  { label: 'Oswald (Tall Impact)', value: 'Oswald, sans-serif' },
  { label: 'Georgia (Warm Reading)', value: 'Georgia, serif' },
  { label: 'JetBrains Mono (Modern Code)', value: 'JetBrains Mono, monospace' },
];

const FONT_WEIGHTS = [
  { label: 'Light (300)', value: 300 },
  { label: 'Regular (400)', value: 400 },
  { label: 'Medium (500)', value: 500 },
  { label: 'Semi-Bold (600)', value: 600 },
  { label: 'Bold (700)', value: 700 },
  { label: 'Extra Bold (800)', value: 800 },
  { label: 'Black (900)', value: 900 },
];

const COLOR_SWATCHES = [
  '#ffffff', '#fef08a', '#fed7aa', '#fbcfe8',
  '#38bdf8', '#34d399', '#a78bfa', '#f59e0b',
  '#ef4444', '#94a3b8', '#1e293b', '#000000'
];

export const StyleEditor: React.FC<StyleEditorProps> = ({
  theme,
  onUpdateTheme,
}) => {
  return (
    <aside className="studio-column right">
      <div className="column-header">
        <div className="column-title">
          <Sliders size={14} color="#f59e0b" />
          Style & Theme Inspector
        </div>
      </div>

      <div className="column-content" style={{ gap: '16px' }}>
        {/* Instant Theme Presets */}
        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} color="#f59e0b" /> Style Presets
            </span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {THEME_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                className="btn"
                style={{
                  fontSize: '11px',
                  padding: '6px 8px',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                onClick={() => onUpdateTheme(preset.theme)}
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

        {/* Typography Controls */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Type size={13} /> Typography
          </div>

          {/* Font Family */}
          <div className="form-group">
            <label className="form-label">Font Family</label>
            <select
              className="form-select"
              value={theme.fontFamily}
              onChange={e => onUpdateTheme({ fontFamily: e.target.value })}
            >
              {FONT_FAMILIES.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">
                <span>Font Size</span>
                <span style={{ color: '#f59e0b' }}>{theme.fontSize}px</span>
              </label>
              <input
                type="range"
                className="custom-slider"
                min="20"
                max="80"
                value={theme.fontSize}
                onChange={e => onUpdateTheme({ fontSize: +e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Font Weight</label>
              <select
                className="form-select"
                value={theme.fontWeight}
                onChange={e => onUpdateTheme({ fontWeight: +e.target.value })}
              >
                {FONT_WEIGHTS.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Style / Transform / Align buttons */}
          <div className="form-group">
            <label className="form-label">Alignment & Case</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', padding: '2px' }}>
                <button
                  className={`btn btn-icon ${theme.textAlign === 'left' ? 'btn-primary' : ''}`}
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => onUpdateTheme({ textAlign: 'left' })}
                  title="Align Left"
                >
                  <AlignLeft size={13} />
                </button>
                <button
                  className={`btn btn-icon ${theme.textAlign === 'center' ? 'btn-primary' : ''}`}
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => onUpdateTheme({ textAlign: 'center' })}
                  title="Align Center"
                >
                  <AlignCenter size={13} />
                </button>
                <button
                  className={`btn btn-icon ${theme.textAlign === 'right' ? 'btn-primary' : ''}`}
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => onUpdateTheme({ textAlign: 'right' })}
                  title="Align Right"
                >
                  <AlignRight size={13} />
                </button>
              </div>

              <button
                className={`btn ${theme.fontStyle === 'italic' ? 'btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px', fontStyle: 'italic' }}
                onClick={() => onUpdateTheme({ fontStyle: theme.fontStyle === 'italic' ? 'normal' : 'italic' })}
              >
                Italic
              </button>

              <button
                className={`btn ${theme.textTransform === 'uppercase' ? 'btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => onUpdateTheme({ textTransform: theme.textTransform === 'uppercase' ? 'none' : 'uppercase' })}
              >
                CAPS
              </button>
            </div>
          </div>

          {/* Text Color Picker */}
          <div className="form-group">
            <label className="form-label">
              <span>Text Color</span>
              <span style={{ color: theme.textColor }}>{theme.textColor}</span>
            </label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="color"
                value={theme.textColor}
                onChange={e => onUpdateTheme({ textColor: e.target.value })}
                style={{ width: '32px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                {COLOR_SWATCHES.map(color => (
                  <div
                    key={color}
                    onClick={() => onUpdateTheme({ textColor: color })}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: color,
                      cursor: 'pointer',
                      border: theme.textColor === color ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

        {/* Outline & Shadow (Overlay Legibility) */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tv size={13} /> Contrast & Overlay Stroke
          </div>

          {/* Text Outline Toggle & Width */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Text Stroke / Outline</label>
              <input
                type="checkbox"
                checked={theme.textOutline}
                onChange={e => onUpdateTheme({ textOutline: e.target.checked })}
              />
            </div>
            {theme.textOutline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="range"
                  className="custom-slider"
                  min="1"
                  max="6"
                  value={theme.outlineWidth}
                  onChange={e => onUpdateTheme({ outlineWidth: +e.target.value })}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{theme.outlineWidth}px</span>
                <input
                  type="color"
                  value={theme.outlineColor.startsWith('#') ? theme.outlineColor : '#000000'}
                  onChange={e => onUpdateTheme({ outlineColor: e.target.value })}
                  style={{ width: '24px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
              </div>
            )}
          </div>

          {/* Drop Shadow Toggle & Blur */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Broadcast Drop Shadow</label>
              <input
                type="checkbox"
                checked={theme.textShadow}
                onChange={e => onUpdateTheme({ textShadow: e.target.checked })}
              />
            </div>
            {theme.textShadow && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="range"
                  className="custom-slider"
                  min="2"
                  max="30"
                  value={theme.shadowBlur}
                  onChange={e => onUpdateTheme({ shadowBlur: +e.target.value })}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{theme.shadowBlur}px</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

        {/* Background Settings */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Palette size={13} /> Background & Layout
          </div>

          <div className="form-group">
            <label className="form-label">Background Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                className={`btn ${theme.bgType === 'animated-gradient' ? 'btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '6px' }}
                onClick={() => onUpdateTheme({ bgType: 'animated-gradient' })}
              >
                Motion Gradient
              </button>
              <button
                className={`btn ${theme.bgType === 'solid' ? 'btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '6px' }}
                onClick={() => onUpdateTheme({ bgType: 'solid' })}
              >
                Solid Color
              </button>
              <button
                className={`btn ${theme.bgType === 'transparent' ? 'btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '6px' }}
                onClick={() => onUpdateTheme({ bgType: 'transparent' })}
              >
                Transparent (vMix)
              </button>
              <button
                className={`btn ${theme.bgType === 'gradient' ? 'btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '6px' }}
                onClick={() => onUpdateTheme({ bgType: 'gradient' })}
              >
                Static Gradient
              </button>
            </div>
          </div>

          {theme.bgType === 'solid' && (
            <div className="form-group">
              <label className="form-label">Solid Color Picker</label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={theme.bgColor}
                  onChange={e => onUpdateTheme({ bgColor: e.target.value })}
                  style={{ width: '32px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={theme.bgColor}
                  onChange={e => onUpdateTheme({ bgColor: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Layout Display Mode */}
          <div className="form-group">
            <label className="form-label">Display Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                className={`btn ${theme.displayMode === 'fullscreen' ? 'btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '6px' }}
                onClick={() => onUpdateTheme({ displayMode: 'fullscreen' })}
              >
                Full Screen
              </button>
              <button
                className={`btn ${theme.displayMode === 'lower-third' ? 'btn-primary' : ''}`}
                style={{ fontSize: '11px', padding: '6px' }}
                onClick={() => onUpdateTheme({ displayMode: 'lower-third' })}
              >
                Lower-Third
              </button>
            </div>
          </div>

          {/* Next Preview Toggle */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ margin: 0 }}>Show Next Line Subtitle</label>
              <input
                type="checkbox"
                checked={theme.showNextPreview}
                onChange={e => onUpdateTheme({ showNextPreview: e.target.checked })}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
