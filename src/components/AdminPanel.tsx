import { useState, useRef } from 'react';
import { EditDialog } from './EditDialog';
import { ThemeDialog } from './ThemeDialog';
import { FooterDialog } from './FooterDialog';
import { PRESET_ICONS } from './SocialButtons';
import type { SiteConfig, SocialLink } from '../types';

interface AdminPanelProps {
  config: SiteConfig;
  socialLinks: SocialLink[];
  onUpdateConfig: (data: Partial<SiteConfig>) => Promise<{ success: boolean }>;
  onAddSocial: (data: Partial<SocialLink>) => Promise<void>;
  onUpdateSocial: (id: number, data: Partial<SocialLink>) => Promise<void>;
  onDeleteSocial: (id: number) => Promise<void>;
  onAddCategory: () => void;
  onLogout: () => void;
}

type DialogType =
  | 'site' | 'bg' | 'theme' | 'footer'
  | 'social_manage' | 'social_new' | 'social_edit'
  | null;

/* ── Background Settings Dialog ─────────────────────────────────────── */
function BgDialog({
  config, onSave, onClose,
}: {
  config: SiteConfig;
  onSave: (vals: Partial<SiteConfig>) => Promise<{ success: boolean }>;
  onClose: () => void;
}) {
  const [tab, setTab]             = useState<'url' | 'upload'>('upload');
  const [urlVal, setUrlVal]       = useState(config.bg_image || '');
  const [overlay, setOverlay]     = useState(config.bg_overlay || '0.3');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [preview, setPreview]     = useState(config.bg_image || '');
  const [errMsg, setErrMsg]       = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem('nav_token') || '';

  const uploadFile = async (file: File) => {
    setErrMsg('');
    if (!file) return;
    const allowedExt = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
    if (!allowedExt.test(file.name)) { setErrMsg('仅支持 JPG / PNG / WebP / GIF / AVIF / SVG'); return; }
    if (file.size > 20 * 1024 * 1024) { setErrMsg('文件不能超过 20MB'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const resp = await fetch('/api/upload/bg', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      let json: Record<string, string> = {};
      try { json = await resp.json(); } catch { /**/ }
      if (!resp.ok) throw new Error(json?.error || `服务器错误 HTTP ${resp.status}`);
      if (!json?.url) throw new Error('服务器未返回图片地址');
      setPreview(json.url);
      setUrlVal(json.url);
    } catch (e: unknown) {
      setErrMsg((e instanceof Error) ? e.message : '上传失败，请重试');
    } finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ bg_image: tab === 'url' ? urlVal.trim() : preview, bg_overlay: overlay });
    setSaving(false); onClose();
  };

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.52)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="scale-in dialog-glass w-full max-w-md"
        style={{ borderRadius: 24, display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-container-low)', borderRadius: '24px 24px 0 0', flexShrink: 0 }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>🖼️ 背景设置</h2>
          <button onClick={onClose} className="md3-icon-btn" style={{ background: 'var(--md-sys-color-surface-container-high)', borderRadius: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--md-sys-color-surface-container)' }}>
            {(['upload', 'url'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: tab === t ? 'var(--md-sys-color-primary)' : 'transparent', color: tab === t ? '#fff' : 'var(--md-sys-color-on-surface-variant)' }}>
                {t === 'upload' ? '📁 本地上传' : '🔗 URL 输入'}
              </button>
            ))}
          </div>

          {tab === 'upload' && (
            <div
              className="relative rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
              style={{ border: `2px dashed ${dragOver ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`, background: dragOver ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-low)', minHeight: 140, padding: '24px 16px' }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}>
              {uploading ? (
                <>
                  <svg className="md3-progress-ring w-10 h-10" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--md-sys-color-primary)' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20"/>
                  </svg>
                  <span className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>上传中…</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10" style={{ color: 'var(--md-sys-color-primary)' }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>点击或拖拽图片到此处</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>支持 JPG / PNG / WebP / GIF · 最大 20MB</p>
                  </div>
                </>
              )}
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.avif,.svg" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }}/>
            </div>
          )}

          {tab === 'url' && (
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>背景图片 URL</label>
              <input type="url" value={urlVal} onChange={e => { setUrlVal(e.target.value); setPreview(e.target.value); }}
                placeholder="https://example.com/background.jpg"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--md-sys-color-surface-container)', border: '1.5px solid var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}/>
            </div>
          )}

          {errMsg && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-error)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errMsg}
            </div>
          )}

          {preview && (
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>预览</label>
              <div className="w-full rounded-2xl overflow-hidden relative" style={{ height: 120, background: '#eee' }}>
                <img src={preview} alt="背景预览" className="w-full h-full object-cover" onError={() => setErrMsg('图片加载失败，请检查 URL')}/>
                <button onClick={() => { setPreview(''); setUrlVal(''); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>深色遮罩</label>
              <span className="text-sm font-semibold px-2 py-0.5 rounded-lg"
                style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>{overlay}</span>
            </div>
            <input type="range" min="0" max="0.9" step="0.05" value={overlay} onChange={e => setOverlay(e.target.value)}
              className="w-full" style={{ accentColor: 'var(--md-sys-color-primary)' }}/>
            <div className="flex justify-between text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              <span>无遮罩</span><span>较暗</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-container-low)', borderRadius: '0 0 24px 24px', flexShrink: 0 }}>
          <button onClick={async () => { setSaving(true); setPreview(''); setUrlVal(''); await onSave({ bg_image: '', bg_overlay: overlay }); setSaving(false); onClose(); }}
            className="md3-btn" style={{ height: 40, padding: '0 16px', fontSize: 13, background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-error)' }}>
            清除背景
          </button>
          <div className="flex-1"/>
          <button onClick={onClose} className="md3-btn md3-btn-outlined" style={{ height: 40, padding: '0 20px', fontSize: 13 }}>取消</button>
          <button onClick={handleSave} disabled={saving || uploading} className="md3-btn md3-btn-filled"
            style={{ height: 40, padding: '0 20px', fontSize: 13, opacity: (saving || uploading) ? 0.7 : 1 }}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Social Icon Picker ──────────────────────────────────────────────── */
function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = PRESET_ICONS.find(i => i.key === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>图标</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
        style={{
          background: 'var(--md-sys-color-surface-container)',
          border: '1.5px solid var(--md-sys-color-outline-variant)',
          color: 'var(--md-sys-color-on-surface)',
        }}
      >
        {current ? (
          <>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0"
              style={{ background: current.color }}>
              <span style={{ transform: 'scale(0.85)', display: 'flex' }}>
                {/* just show color dot */}
              </span>
            </span>
            <span className="flex-1">{current.label}</span>
          </>
        ) : (
          <span className="flex-1 opacity-60">{value || '选择图标...'}</span>
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="rounded-2xl p-3 grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto"
          style={{ background: 'var(--md-sys-color-surface-container-low)', border: '1.5px solid var(--md-sys-color-outline-variant)' }}>
          {PRESET_ICONS.map(icon => (
            <button
              key={icon.key}
              type="button"
              onClick={() => { onChange(icon.key); setOpen(false); }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:scale-105"
              style={{
                background: value === icon.key ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
                border: `1.5px solid ${value === icon.key ? 'var(--md-sys-color-primary)' : 'transparent'}`,
              }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: icon.color }}>
                <span className="text-white text-xs font-bold">{icon.label.charAt(0)}</span>
              </div>
              <span className="text-xs text-center leading-tight" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 10 }}>
                {icon.label}
              </span>
            </button>
          ))}
          {/* Custom text input */}
          <div className="col-span-full mt-1">
            <input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="或手动输入图标名..."
              className="w-full px-3 py-2 rounded-xl text-xs outline-none"
              style={{
                background: 'var(--md-sys-color-surface-container)',
                border: '1.5px solid var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Social Add/Edit Form ────────────────────────────────────────────── */
function SocialForm({
  initial,
  onSave,
  onClose,
  title,
}: {
  initial?: Partial<SocialLink>;
  onSave: (data: Partial<SocialLink>) => Promise<void>;
  onClose: () => void;
  title: string;
}) {
  const [platform, setPlatform] = useState(initial?.platform || '');
  const [url, setUrl]           = useState(initial?.url || '');
  const [icon, setIcon]         = useState(initial?.icon || '');
  const [color, setColor]       = useState(initial?.color || '#0288d1');
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  // When icon changes, auto-suggest color
  const handleIconChange = (v: string) => {
    setIcon(v);
    const preset = PRESET_ICONS.find(i => i.key === v);
    if (preset) {
      setColor(preset.color);
      if (!platform) setPlatform(preset.label);
    }
  };

  const handleSubmit = async () => {
    if (!platform.trim()) { setErr('请填写平台名称'); return; }
    if (!url.trim()) { setErr('请填写链接地址'); return; }
    setSaving(true);
    try {
      await onSave({ platform, url, icon, color, sort_order: sortOrder });
      onClose();
    } catch {
      setErr('保存失败，请重试');
    } finally { setSaving(false); }
  };

  return (
    <div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.52)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="scale-in dialog-glass w-full max-w-md"
        style={{ borderRadius: 24, display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-container-low)', borderRadius: '24px 24px 0 0', flexShrink: 0 }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>{title}</h2>
          <button onClick={onClose} className="md3-icon-btn" style={{ background: 'var(--md-sys-color-surface-container-high)', borderRadius: 10 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Icon picker */}
          <IconPicker value={icon} onChange={handleIconChange} />

          {/* Platform */}
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>平台名称 *</label>
            <input type="text" value={platform} onChange={e => setPlatform(e.target.value)} placeholder="GitHub"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--md-sys-color-surface-container)', border: '1.5px solid var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}/>
          </div>

          {/* URL */}
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>链接地址 *</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://github.com/yourname"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--md-sys-color-surface-container)', border: '1.5px solid var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}/>
          </div>

          {/* Color */}
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>按钮颜色</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-12 h-10 rounded-xl cursor-pointer" style={{ padding: 2, border: '2px solid var(--md-sys-color-outline-variant)' }}/>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ICONS.slice(0, 10).map(pi => (
                  <button key={pi.key} type="button" onClick={() => setColor(pi.color)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{ background: pi.color, border: color === pi.color ? '2px solid white' : '2px solid transparent', boxShadow: color === pi.color ? `0 0 0 2px ${pi.color}` : 'none' }}
                    title={pi.label}/>
                ))}
              </div>
              <code className="text-xs px-2 py-1 rounded-lg font-mono"
                style={{ background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                {color}
              </code>
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-1">
            <label className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>排序权重（数字越小越靠前）</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--md-sys-color-surface-container)', border: '1.5px solid var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}/>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'var(--md-sys-color-surface-container)' }}>
            <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>预览：</span>
            <a className="social-btn pointer-events-none" style={{ backgroundColor: color }}>
              <span className="text-sm font-bold">{(icon || platform).charAt(0).toUpperCase()}</span>
              <span className="hidden sm:inline">{platform || '平台名称'}</span>
            </a>
          </div>

          {err && (
            <div className="px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-error)' }}>
              {err}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-container-low)', borderRadius: '0 0 24px 24px', flexShrink: 0 }}>
          <div className="flex-1"/>
          <button onClick={onClose} className="md3-btn md3-btn-outlined" style={{ height: 40, padding: '0 20px', fontSize: 13 }}>取消</button>
          <button onClick={handleSubmit} disabled={saving} className="md3-btn md3-btn-filled"
            style={{ height: 40, padding: '0 20px', fontSize: 13, opacity: saving ? 0.7 : 1 }}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main AdminPanel ─────────────────────────────────────────────────── */
export function AdminPanel({
  config, socialLinks,
  onUpdateConfig, onAddSocial, onUpdateSocial, onDeleteSocial,
  onAddCategory, onLogout,
}: AdminPanelProps) {
  const [open, setOpen]           = useState(false);
  const [dialog, setDialog]       = useState<DialogType>(null);
  const [editSocial, setEditSocial] = useState<SocialLink | null>(null);

  const menuItems = [
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
      label: '站点设置', color: '#7c3aed', bgColor: '#ede9fe',
      onClick: () => { setDialog('site'); setOpen(false); },
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/></svg>,
      label: '主题颜色', color: '#0284c7', bgColor: '#e0f2fe',
      onClick: () => { setDialog('theme'); setOpen(false); },
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
      label: '背景设置', color: '#0369a1', bgColor: '#e0f2fe',
      onClick: () => { setDialog('bg'); setOpen(false); },
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
      label: '页脚设置', color: '#b45309', bgColor: '#fef3c7',
      onClick: () => { setDialog('footer'); setOpen(false); },
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
      label: '添加分类', color: '#15803d', bgColor: '#dcfce7',
      onClick: () => { onAddCategory(); setOpen(false); },
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
      label: '社交链接', color: '#be185d', bgColor: '#fce7f3',
      onClick: () => { setDialog('social_manage'); setOpen(false); },
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
      label: '退出管理', color: '#64748b', bgColor: '#f1f5f9',
      onClick: () => { onLogout(); setOpen(false); },
    },
  ];

  return (
    <>
      {/* Admin badge */}
      <div
        className="fixed top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: 'var(--md-sys-color-primary-container)',
          color: 'var(--md-sys-color-on-primary-container)',
          border: '1px solid var(--md-sys-color-primary)',
          boxShadow: '0 2px 8px rgba(2,119,189,0.15)',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        编辑模式
      </div>

      {/* FAB Speed Dial */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-3">
        {open && (
          <div className="flex flex-col gap-2 items-end mb-1">
            {menuItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 fade-in" style={{ animationDelay: `${i * 35}ms` }}>
                <span className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium shadow-md whitespace-nowrap"
                  style={{ background: 'rgba(255,255,255,0.95)', color: item.color, backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.8)' }}>
                  {item.label}
                </span>
                <button onClick={item.onClick}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 flex-shrink-0"
                  style={{ background: item.bgColor, color: item.color, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: `1px solid ${item.color}20` }}
                  title={item.label}>
                  {item.icon}
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          className="md3-fab transition-all flex-shrink-0"
          style={{
            background: open ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-primary)',
            color: 'white', width: 56, height: 56, borderRadius: 18,
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'all 0.3s cubic-bezier(0.2,0,0,1)',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Dialogs */}
      {dialog === 'site' && (
        <EditDialog
          title="🌐 站点设置"
          fields={[
            { key: 'site_title', label: '站点标题', required: true, placeholder: '我的导航站' },
            { key: 'site_subtitle', label: '副标题', placeholder: '简洁 · 高效 · 美观' },
            { key: 'site_icon', label: '站点图标 (Emoji)', type: 'emoji', placeholder: '🧭' },
          ]}
          initialValues={config as unknown as Record<string, string | number>}
          onSave={async (vals) => { await onUpdateConfig(vals as Partial<SiteConfig>); }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'theme' && (
        <ThemeDialog config={config} onSave={onUpdateConfig} onClose={() => setDialog(null)} />
      )}

      {dialog === 'bg' && (
        <BgDialog config={config} onSave={onUpdateConfig} onClose={() => setDialog(null)} />
      )}

      {dialog === 'footer' && (
        <FooterDialog config={config} onSave={onUpdateConfig} onClose={() => setDialog(null)} />
      )}

      {dialog === 'social_manage' && (
        <div className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.52)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDialog(null); }}>
          <div className="scale-in dialog-glass w-full max-w-md modal-scroll"
            style={{ borderRadius: 24, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-container-low)', borderRadius: '24px 24px 0 0', flexShrink: 0 }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>🔗 社交链接管理</h2>
              <button onClick={() => setDialog(null)} className="md3-icon-btn" style={{ background: 'var(--md-sys-color-surface-container-high)', borderRadius: 10 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {socialLinks.length === 0 ? (
                <div className="text-center py-10 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 mx-auto mb-3 opacity-40">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  暂无社交链接
                </div>
              ) : (
                socialLinks.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'var(--md-sys-color-surface-container-low)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: s.color || '#0288d1' }}>
                      {s.platform.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{s.platform}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{s.url}</p>
                    </div>
                    <button onClick={() => { setEditSocial(s); setDialog('social_edit'); }} className="md3-icon-btn"
                      style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button onClick={() => { if (confirm(`确定删除「${s.platform}」？`)) onDeleteSocial(s.id); }} className="md3-icon-btn"
                      style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-error)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4"
              style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-container-low)', borderRadius: '0 0 24px 24px', flexShrink: 0 }}>
              <button onClick={() => setDialog('social_new')} className="md3-btn md3-btn-filled w-full" style={{ height: 44 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                添加新社交链接
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'social_new' && (
        <SocialForm
          title="➕ 添加社交链接"
          onSave={async (data) => { await onAddSocial(data); setDialog('social_manage'); }}
          onClose={() => setDialog('social_manage')}
        />
      )}

      {dialog === 'social_edit' && editSocial && (
        <SocialForm
          title="✏️ 编辑社交链接"
          initial={editSocial}
          onSave={async (data) => { await onUpdateSocial(editSocial.id, data); setEditSocial(null); setDialog('social_manage'); }}
          onClose={() => { setDialog('social_manage'); setEditSocial(null); }}
        />
      )}
    </>
  );
}
