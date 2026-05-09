import { useState, useRef, useEffect } from 'react';

interface LoginDialogProps {
  onLogin: (password: string) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function LoginDialog({ onLogin, onClose }: LoginDialogProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setError('请输入密码'); return; }

    setLoading(true);
    setError('');
    try {
      const result = await onLogin(password.trim());
      if (!result.success) {
        setError(result.error || '密码错误，请重试');
        inputRef.current?.select();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`登录时发生错误: ${msg}`);
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
        className="scale-in dialog-glass w-full max-w-sm"
        style={{
          borderRadius: 28,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="px-8 pt-8 pb-4 text-center"
          style={{ background: 'var(--md-sys-color-primary-container)' }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--md-sys-color-primary)', boxShadow: '0 4px 16px rgba(2,119,189,0.3)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-8 h-8">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--md-sys-color-on-primary-container)' }}
          >
            管理员登录
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.7 }}
          >
            请输入管理密码以进入编辑模式
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-6" style={{ background: 'white' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                管理密码
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="请输入管理密码"
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    background: 'var(--md-sys-color-surface-container-highest)',
                    border: error ? '2px solid var(--md-sys-color-error)' : '2px solid var(--md-sys-color-outline-variant)',
                    color: 'var(--md-sys-color-on-surface)',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => {
                    if (!error) e.target.style.borderColor = 'var(--md-sys-color-primary)';
                  }}
                  onBlur={e => {
                    if (!error) e.target.style.borderColor = 'var(--md-sys-color-outline-variant)';
                  }}
                />
                {password && (
                  <button
                    type="button"
                    onClick={() => { setPassword(''); setError(''); inputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 md3-icon-btn"
                    style={{ width: 28, height: 28 }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm slide-up"
                style={{
                  background: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                  border: '1px solid rgba(186,26,26,0.15)',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="md3-btn md3-btn-outlined flex-1"
                style={{ height: 44 }}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="md3-btn md3-btn-filled flex-1"
                style={{
                  height: 44,
                  opacity: loading || !password.trim() ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <>
                    <svg className="md3-progress-ring w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20"/>
                    </svg>
                    验证中…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                    </svg>
                    登 录
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
