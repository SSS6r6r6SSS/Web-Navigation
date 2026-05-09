import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Field {
  key: string;
  label: string;
  type?: 'text' | 'url' | 'textarea' | 'markdown' | 'color' | 'number' | 'emoji';
  placeholder?: string;
  required?: boolean;
}

interface EditDialogProps {
  title: string;
  fields: Field[];
  initialValues?: Record<string, string | number>;
  onSave: (values: Record<string, string | number>) => Promise<void>;
  onClose: () => void;
}

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 10,
  border: '2px solid var(--md-sys-color-outline-variant)',
  background: 'var(--md-sys-color-surface-container-highest)',
  color: 'var(--md-sys-color-on-surface)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s',
};

function Field_Input({
  f,
  value,
  onChange,
}: {
  f: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  const style: React.CSSProperties = {
    ...inputBase,
    borderColor: focused ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
  };

  if (f.type === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={f.placeholder}
        style={style}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    );
  }
  if (f.type === 'url') {
    return (
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={f.placeholder || 'https://...'}
        style={style}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    );
  }
  // text / emoji / default
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={f.placeholder}
      style={style}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export function EditDialog({ title, fields, initialValues = {}, onSave, onClose }: EditDialogProps) {
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const init: Record<string, string | number> = {};
    fields.forEach(f => { init[f.key] = initialValues[f.key] ?? ''; });
    setValues(init);
  }, []);

  const set = (key: string, val: string | number) =>
    setValues(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setError('');
    for (const f of fields) {
      if (f.required && !String(values[f.key] ?? '').trim()) {
        setError(`「${f.label}」不能为空`);
        return;
      }
    }
    setLoading(true);
    try {
      await onSave(values);
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error || e?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.52)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        className="scale-in dialog-glass w-full max-w-lg modal-scroll"
        style={{
          borderRadius: 24,
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
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
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--md-sys-color-on-surface)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="md3-icon-btn"
            style={{ background: 'var(--md-sys-color-surface-container-high)', borderRadius: 10 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 flex-1">
          {fields.map(f => (
            <div key={f.key}>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                {f.label}
                {f.required && (
                  <span style={{ color: 'var(--md-sys-color-error)', marginLeft: 4 }}>*</span>
                )}
              </label>

              {/* Markdown / Textarea */}
              {(f.type === 'markdown' || f.type === 'textarea') && (
                <div>
                  {f.type === 'markdown' && (
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setPreview(preview === f.key ? null : f.key)}
                        className="md3-chip"
                        style={{ height: 26, padding: '0 10px', fontSize: 12 }}
                      >
                        {preview === f.key ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            编辑
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            预览
                          </>
                        )}
                      </button>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--md-sys-color-outline)' }}
                      >
                        支持 Markdown 格式
                      </span>
                    </div>
                  )}

                  {preview === f.key ? (
                    <div
                      className="markdown-content min-h-24 p-4 rounded-xl text-sm"
                      style={{
                        border: '2px solid var(--md-sys-color-primary)',
                        background: 'var(--md-sys-color-surface-container-lowest)',
                        color: 'var(--md-sys-color-on-surface)',
                        minHeight: 96,
                      }}
                    >
                      <ReactMarkdown>{String(values[f.key] || '_（空内容）_')}</ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      value={String(values[f.key] ?? '')}
                      onChange={e => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={4}
                      style={{
                        ...inputBase,
                        borderColor: 'var(--md-sys-color-outline-variant)',
                        resize: 'vertical',
                        minHeight: 96,
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--md-sys-color-primary)'; }}
                      onBlur={e => { e.target.style.borderColor = 'var(--md-sys-color-outline-variant)'; }}
                    />
                  )}
                </div>
              )}

              {/* Color picker */}
              {f.type === 'color' && (
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex-shrink-0"
                    style={{
                      width: 44, height: 44,
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '2px solid var(--md-sys-color-outline-variant)',
                    }}
                  >
                    <input
                      type="color"
                      value={String(values[f.key] ?? '#0288d1')}
                      onChange={e => set(f.key, e.target.value)}
                      style={{
                        position: 'absolute', inset: '-4px',
                        width: 'calc(100% + 8px)', height: 'calc(100% + 8px)',
                        cursor: 'pointer', border: 'none',
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    value={String(values[f.key] ?? '')}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder="#0288d1"
                    style={{ ...inputBase, flex: 1 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--md-sys-color-primary)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--md-sys-color-outline-variant)'; }}
                  />
                </div>
              )}

              {/* Regular inputs */}
              {(!f.type || f.type === 'text' || f.type === 'url' || f.type === 'emoji' || f.type === 'number') && (
                <Field_Input
                  f={f}
                  value={String(values[f.key] ?? '')}
                  onChange={v => set(f.key, v)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mx-6 mb-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
            style={{
              background: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4"
          style={{
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
            background: 'var(--md-sys-color-surface-container-low)',
            borderRadius: '0 0 24px 24px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            className="md3-btn md3-btn-outlined flex-1"
            style={{ height: 44 }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="md3-btn md3-btn-filled flex-1"
            style={{ height: 44, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <svg className="md3-progress-ring w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20"/>
                </svg>
                保存中…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
