import { useState } from 'react';
import type { SiteConfig } from '../types';

interface FooterDialogProps {
  config: SiteConfig;
  onSave: (vals: Partial<SiteConfig>) => Promise<{ success: boolean }>;
  onClose: () => void;
}

const DEFAULT_FOOTER = `<p>Powered by <strong>NavSite</strong> · Material Design 3</p>`;

const PRESETS = [
  {
    name: '默认',
    html: `<p>Powered by <strong>NavSite</strong> · Material Design 3</p>`,
  },
  {
    name: 'ICP 备案',
    html: `<p>© 2024 我的导航站</p>\n<p><a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">粤ICP备XXXXXXXX号</a></p>`,
  },
  {
    name: '多行信息',
    html: `<p>© 2024 <strong>我的导航站</strong> · All rights reserved</p>\n<p style="margin-top:4px;font-size:12px;opacity:0.7">联系我：<a href="mailto:admin@example.com">admin@example.com</a></p>`,
  },
  {
    name: '社交信息',
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">\n  <p>© 2024 My Navigation Site</p>\n  <p style="font-size:12px">Built with ❤️ using React &amp; Material Design 3</p>\n</div>`,
  },
  {
    name: '清空',
    html: '',
  },
];

export function FooterDialog({ config, onSave, onClose }: FooterDialogProps) {
  const [html, setHtml] = useState(config.footer_html || DEFAULT_FOOTER);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  const handleSave = async () => {
    setSaving(true);
    await onSave({ footer_html: html });
    setSaving(false);
    onClose();
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
              📝 页脚设置
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              支持自定义 HTML 代码
            </p>
          </div>
          <button onClick={onClose} className="md3-icon-btn"
            style={{ background: 'var(--md-sys-color-surface-container-high)', borderRadius: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Presets */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              快速预设
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setHtml(preset.html)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: html === preset.html
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--md-sys-color-surface-container)',
                    color: html === preset.html
                      ? 'var(--md-sys-color-on-primary)'
                      : 'var(--md-sys-color-on-surface-variant)',
                    border: `1px solid ${html === preset.html ? 'transparent' : 'var(--md-sys-color-outline-variant)'}`,
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab */}
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--md-sys-color-surface-container)' }}>
            {(['edit', 'preview'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === t ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {t === 'edit' ? '✏️ 编辑 HTML' : '👁️ 预览'}
              </button>
            ))}
          </div>

          {/* Editor */}
          {tab === 'edit' ? (
            <div className="space-y-2">
              <textarea
                value={html}
                onChange={e => setHtml(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all"
                style={{
                  background: 'var(--md-sys-color-surface-container)',
                  border: '1.5px solid var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                  minHeight: 160,
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
                placeholder="输入 HTML 代码，留空则不显示页脚..."
                spellCheck={false}
              />
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>支持完整 HTML 语法，可使用 inline style、链接等。注意避免插入恶意脚本。</span>
              </div>
            </div>
          ) : (
            /* Preview */
            <div
              className="rounded-2xl p-6 text-center text-sm min-h-[100px] flex items-center justify-center"
              style={{
                background: 'var(--md-sys-color-surface-container)',
                color: 'var(--md-sys-color-on-surface-variant)',
                border: '1px dashed var(--md-sys-color-outline-variant)',
              }}
            >
              {html ? (
                <div
                  className="footer-preview"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <span className="opacity-50">页脚为空，不会显示任何内容</span>
              )}
            </div>
          )}
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
            onClick={() => setHtml('')}
            className="md3-btn"
            style={{
              height: 40, padding: '0 16px', fontSize: 13,
              background: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-error)',
            }}
          >
            清空
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
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
