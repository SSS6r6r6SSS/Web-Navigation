import { useState } from 'react';
import type { SiteConfig } from '../types';

interface ThemeDialogProps {
  config: SiteConfig;
  onSave: (vals: Partial<SiteConfig>) => Promise<{ success: boolean }>;
  onClose: () => void;
}

// MD3 Predefined color palettes
const PALETTES = [
  {
    name: '蓝色（默认）',
    colors: {
      color_primary: '#0277bd',
      color_on_primary: '#ffffff',
      color_primary_container: '#b3e5fc',
      color_on_primary_container: '#01395e',
      color_secondary: '#0288d1',
      color_secondary_container: '#e1f5fe',
      color_on_secondary_container: '#014f7a',
      color_surface: '#f8fbff',
      color_on_surface: '#191c1e',
      color_on_surface_variant: '#3f4a52',
      color_outline: '#6f7f8c',
      color_outline_variant: '#bfcdd8',
    },
  },
  {
    name: '深蓝紫',
    colors: {
      color_primary: '#3949ab',
      color_on_primary: '#ffffff',
      color_primary_container: '#c5cae9',
      color_on_primary_container: '#1a237e',
      color_secondary: '#5c6bc0',
      color_secondary_container: '#e8eaf6',
      color_on_secondary_container: '#283593',
      color_surface: '#f9f9ff',
      color_on_surface: '#1a1b1f',
      color_on_surface_variant: '#44464f',
      color_outline: '#757780',
      color_outline_variant: '#c5c6d0',
    },
  },
  {
    name: '青绿',
    colors: {
      color_primary: '#00796b',
      color_on_primary: '#ffffff',
      color_primary_container: '#b2dfdb',
      color_on_primary_container: '#00251a',
      color_secondary: '#009688',
      color_secondary_container: '#e0f2f1',
      color_on_secondary_container: '#00382f',
      color_surface: '#f4faf9',
      color_on_surface: '#191c1b',
      color_on_surface_variant: '#3f4945',
      color_outline: '#6f7975',
      color_outline_variant: '#bfccc8',
    },
  },
  {
    name: '紫色',
    colors: {
      color_primary: '#7b1fa2',
      color_on_primary: '#ffffff',
      color_primary_container: '#e1bee7',
      color_on_primary_container: '#4a0072',
      color_secondary: '#8e24aa',
      color_secondary_container: '#f3e5f5',
      color_on_secondary_container: '#5e0079',
      color_surface: '#fdf7ff',
      color_on_surface: '#1d1b1e',
      color_on_surface_variant: '#49454e',
      color_outline: '#7a7382',
      color_outline_variant: '#cac4d0',
    },
  },
  {
    name: '橙色',
    colors: {
      color_primary: '#e65100',
      color_on_primary: '#ffffff',
      color_primary_container: '#ffe0b2',
      color_on_primary_container: '#7f2800',
      color_secondary: '#f57c00',
      color_secondary_container: '#fff3e0',
      color_on_secondary_container: '#8d3800',
      color_surface: '#fffbf7',
      color_on_surface: '#201a17',
      color_on_surface_variant: '#53433c',
      color_outline: '#857468',
      color_outline_variant: '#d8c2b8',
    },
  },
  {
    name: '玫瑰',
    colors: {
      color_primary: '#c2185b',
      color_on_primary: '#ffffff',
      color_primary_container: '#fce4ec',
      color_on_primary_container: '#7c002a',
      color_secondary: '#e91e63',
      color_secondary_container: '#fce4ec',
      color_on_secondary_container: '#9b0041',
      color_surface: '#fff8f9',
      color_on_surface: '#201a1b',
      color_on_surface_variant: '#534343',
      color_outline: '#857373',
      color_outline_variant: '#d8c2c2',
    },
  },
  {
    name: '暗黑',
    colors: {
      color_primary: '#90caf9',
      color_on_primary: '#0d2136',
      color_primary_container: '#1a3a5c',
      color_on_primary_container: '#cce5ff',
      color_secondary: '#80deea',
      color_secondary_container: '#1a3d42',
      color_on_secondary_container: '#b2ebf2',
      color_surface: '#1a1c1e',
      color_on_surface: '#e2e2e6',
      color_on_surface_variant: '#c4c7ce',
      color_outline: '#8e9199',
      color_outline_variant: '#43474e',
    },
  },
];

const COLOR_FIELDS: Array<{ key: keyof SiteConfig; label: string; hint: string }> = [
  { key: 'color_primary', label: '主色调', hint: '按钮、链接等主要强调色' },
  { key: 'color_on_primary', label: '主色文字', hint: '主色背景上的文字颜色' },
  { key: 'color_primary_container', label: '主色容器', hint: '轻量主色背景（标签、图标背景）' },
  { key: 'color_on_primary_container', label: '主色容器文字', hint: '主色容器上的文字颜色' },
  { key: 'color_secondary', label: '辅助色', hint: '次要按钮、高亮' },
  { key: 'color_secondary_container', label: '辅助容器', hint: '辅助色的轻量背景' },
  { key: 'color_on_secondary_container', label: '辅助容器文字', hint: '辅助容器上的文字' },
  { key: 'color_surface', label: '表面色', hint: '卡片/对话框等容器背景' },
  { key: 'color_on_surface', label: '表面文字', hint: '主要文字颜色' },
  { key: 'color_on_surface_variant', label: '次要文字', hint: '辅助/描述文字颜色' },
  { key: 'color_outline', label: '边框色', hint: '输入框、分隔线边框' },
  { key: 'color_outline_variant', label: '轻边框色', hint: '轻量分隔线颜色' },
];

export function ThemeDialog({ config, onSave, onClose }: ThemeDialogProps) {
  const [colors, setColors] = useState<Partial<SiteConfig>>(() => {
    const c: Partial<SiteConfig> = {};
    COLOR_FIELDS.forEach(f => { c[f.key] = config[f.key] || ''; });
    return c;
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'palette' | 'custom'>('palette');

  const applyPalette = (palette: typeof PALETTES[0]) => {
    setColors(palette.colors as Partial<SiteConfig>);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(colors);
    setSaving(false);
    onClose();
  };

  const handleReset = async () => {
    const defaults = PALETTES[0].colors as Partial<SiteConfig>;
    setColors(defaults);
  };

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.52)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="scale-in dialog-glass w-full max-w-lg"
        style={{ borderRadius: 24, display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            background: 'var(--md-sys-color-surface-container-low)',
            borderRadius: '24px 24px 0 0',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              🎨 主题颜色
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              自定义全站 Material Design 3 颜色
            </p>
          </div>
          <button onClick={onClose} className="md3-icon-btn"
            style={{ background: 'var(--md-sys-color-surface-container-high)', borderRadius: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--md-sys-color-surface-container)' }}>
            {(['palette', 'custom'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: activeTab === t ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: activeTab === t ? '#fff' : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {t === 'palette' ? '🎭 预设色板' : '🖌️ 自定义'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {activeTab === 'palette' ? (
            /* Palette grid */
            <div className="grid grid-cols-2 gap-3">
              {PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  onClick={() => applyPalette(palette)}
                  className="rounded-2xl p-3 text-left transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: palette.colors.color_surface,
                    border: `2px solid ${
                      colors.color_primary === palette.colors.color_primary
                        ? palette.colors.color_primary
                        : palette.colors.color_outline_variant
                    }`,
                    boxShadow: colors.color_primary === palette.colors.color_primary
                      ? `0 0 0 2px ${palette.colors.color_primary}40`
                      : 'none',
                  }}
                >
                  {/* Color swatches */}
                  <div className="flex gap-1.5 mb-2">
                    {[
                      palette.colors.color_primary,
                      palette.colors.color_secondary,
                      palette.colors.color_primary_container,
                      palette.colors.color_secondary_container,
                    ].map((c, i) => (
                      <div
                        key={i}
                        className="h-5 rounded-md flex-1"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: palette.colors.color_on_surface }}
                  >
                    {palette.name}
                  </p>
                  {colors.color_primary === palette.colors.color_primary && (
                    <div
                      className="mt-1 text-xs font-semibold"
                      style={{ color: palette.colors.color_primary }}
                    >
                      ✓ 当前选中
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            /* Custom color pickers */
            <div className="space-y-3">
              {COLOR_FIELDS.map(field => (
                <div key={field.key} className="flex items-center gap-3">
                  {/* Color input */}
                  <div className="relative flex-shrink-0">
                    <input
                      type="color"
                      value={(colors[field.key] as string) || '#000000'}
                      onChange={e => setColors(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-10 h-10 rounded-xl cursor-pointer border-2"
                      style={{
                        borderColor: 'var(--md-sys-color-outline-variant)',
                        padding: 2,
                      }}
                      title={field.label}
                    />
                  </div>
                  {/* Label + hint */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {field.label}
                      </span>
                      <code
                        className="text-xs px-1.5 py-0.5 rounded font-mono"
                        style={{
                          background: 'var(--md-sys-color-surface-container)',
                          color: 'var(--md-sys-color-on-surface-variant)',
                        }}
                      >
                        {(colors[field.key] as string) || '—'}
                      </code>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {field.hint}
                    </p>
                  </div>
                  {/* Hex input */}
                  <input
                    type="text"
                    value={(colors[field.key] as string) || ''}
                    onChange={e => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                        setColors(prev => ({ ...prev, [field.key]: v }));
                      }
                    }}
                    className="w-24 px-2 py-1.5 rounded-lg text-xs font-mono text-center outline-none"
                    style={{
                      background: 'var(--md-sys-color-surface-container)',
                      border: '1.5px solid var(--md-sys-color-outline-variant)',
                      color: 'var(--md-sys-color-on-surface)',
                    }}
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Live preview */}
          <div
            className="rounded-2xl p-4 mt-2"
            style={{
              background: (colors.color_surface as string) || '#f8fbff',
              border: `1px solid ${(colors.color_outline_variant as string) || '#bfcdd8'}`,
            }}
          >
            <p className="text-xs font-medium mb-3" style={{ color: (colors.color_on_surface_variant as string) || '#3f4a52' }}>
              实时预览
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                className="px-4 py-1.5 rounded-full text-sm font-medium"
                style={{
                  background: (colors.color_primary as string) || '#0277bd',
                  color: (colors.color_on_primary as string) || '#ffffff',
                }}
              >
                主色按钮
              </button>
              <button
                className="px-4 py-1.5 rounded-full text-sm font-medium"
                style={{
                  background: (colors.color_secondary_container as string) || '#e1f5fe',
                  color: (colors.color_on_secondary_container as string) || '#014f7a',
                }}
              >
                辅助按钮
              </button>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: (colors.color_primary_container as string) || '#b3e5fc',
                  color: (colors.color_on_primary_container as string) || '#01395e',
                }}
              >
                标签
              </span>
              <span className="text-sm" style={{ color: (colors.color_on_surface as string) || '#191c1e' }}>
                主文字
              </span>
              <span className="text-sm" style={{ color: (colors.color_on_surface_variant as string) || '#3f4a52' }}>
                次文字
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
            background: 'var(--md-sys-color-surface-container-low)',
            borderRadius: '0 0 24px 24px',
          }}
        >
          <button
            onClick={handleReset}
            className="md3-btn"
            style={{
              height: 40, padding: '0 16px', fontSize: 13,
              background: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            重置默认
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="md3-btn md3-btn-outlined" style={{ height: 40, padding: '0 20px', fontSize: 13 }}>
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="md3-btn md3-btn-filled"
            style={{ height: 40, padding: '0 20px', fontSize: 13, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? '保存中…' : '应用主题'}
          </button>
        </div>
      </div>
    </div>
  );
}
