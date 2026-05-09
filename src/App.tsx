import { useState, useEffect } from 'react';
import { DigitalClock } from './components/DigitalClock';
import { Hitokoto } from './components/Hitokoto';
import { SocialButtons } from './components/SocialButtons';
import { CategorySection } from './components/CategorySection';
import { LoginDialog } from './components/LoginDialog';
import { AdminPanel } from './components/AdminPanel';
import { EditDialog } from './components/EditDialog';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import type { Category, NavLink } from './types';

type DialogState =
  | { type: 'cat_add' }
  | { type: 'cat_edit'; cat: Category }
  | { type: 'link_add'; categoryId: number }
  | { type: 'link_edit'; link: NavLink }
  | null;

/** Apply theme color CSS variables from config to :root */
function applyThemeColors(config: Record<string, string>) {
  const root = document.documentElement;
  const map: Record<string, string> = {
    color_primary:                '--md-sys-color-primary',
    color_on_primary:             '--md-sys-color-on-primary',
    color_primary_container:      '--md-sys-color-primary-container',
    color_on_primary_container:   '--md-sys-color-on-primary-container',
    color_secondary:              '--md-sys-color-secondary',
    color_secondary_container:    '--md-sys-color-secondary-container',
    color_on_secondary_container: '--md-sys-color-on-secondary-container',
    color_surface:                '--md-sys-color-surface',
    color_on_surface:             '--md-sys-color-on-surface',
    color_on_surface_variant:     '--md-sys-color-on-surface-variant',
    color_outline:                '--md-sys-color-outline',
    color_outline_variant:        '--md-sys-color-outline-variant',
  };
  Object.entries(map).forEach(([configKey, cssVar]) => {
    const val = config[configKey];
    if (val && /^#[0-9a-fA-F]{3,6}$/.test(val)) {
      root.style.setProperty(cssVar, val);
    }
  });
}

export function App() {
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const {
    categories, socialLinks, config,
    loading, error,
    updateConfig,
    addCategory, updateCategory, deleteCategory,
    addLink, updateLink, deleteLink,
    addSocial, updateSocial, deleteSocial,
  } = useData();

  const [showLogin, setShowLogin]     = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [toast, setToast]             = useState('');

  // Apply theme colors whenever config changes
  useEffect(() => {
    applyThemeColors(config as unknown as Record<string, string>);
  }, [config]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  /* ── Background style ── */
  const hasBg = Boolean(config.bg_image);
  const bgStyle: React.CSSProperties = hasBg
    ? {
        backgroundImage: `url(${config.bg_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : {
        background: 'linear-gradient(145deg, #bbdefb 0%, #e3f2fd 35%, #e1f5fe 65%, #b3e5fc 100%)',
      };

  const overlayOpacity = parseFloat(config.bg_overlay || '0.3');

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={bgStyle}>
        <div className="text-center px-10 py-8 rounded-3xl"
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(2,119,189,0.12)' }}>
          <svg className="md3-progress-ring w-10 h-10 mx-auto mb-4" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--md-sys-color-primary)' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20"/>
          </svg>
          <p className="text-base font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>加载中…</p>
        </div>
      </div>
    );
  }

  /* ── Error screen ── */
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={bgStyle}>
        <div className="text-center px-8 py-8 rounded-3xl w-full max-w-sm"
          style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--md-sys-color-on-surface)' }}>连接失败</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{error}</p>
          <div className="text-xs text-left p-3 rounded-xl"
            style={{ background: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface-variant)' }}>
            请确保后端服务已启动：<br/>
            <code style={{ color: 'var(--md-sys-color-primary)' }}>node server/index.js</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={bgStyle}>
      {/* Dark overlay for bg image */}
      {hasBg && (
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: `rgba(0,0,0,${overlayOpacity})`, zIndex: 0 }}/>
      )}

      <div className="relative" style={{ zIndex: 1 }}>
        {/* ══ Top App Bar (not sticky) ══ */}
        <header className="nav-header flex items-center justify-between px-4 sm:px-6 md:px-10"
          style={{ '--has-bg': hasBg ? '1' : '0' } as React.CSSProperties}
          data-has-bg={hasBg ? 'true' : 'false'}
        >
          {/* Site identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="nav-header-icon text-xl sm:text-2xl flex-shrink-0 select-none">
              {config.site_icon || '🧭'}
            </span>
            <div className="min-w-0">
              <h1 className="nav-header-title text-sm sm:text-[15px] font-medium leading-tight truncate"
                style={{ maxWidth: 'min(200px, 40vw)' }}>
                {config.site_title || '我的导航站'}
              </h1>
              {config.site_subtitle && (
                <p className="nav-header-sub text-xs leading-tight truncate hidden sm:block">
                  {config.site_subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isAuthenticated && (
              <button
                onClick={() => setShowLogin(true)}
                className="nav-header-btn flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 flex-shrink-0">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span className="hidden xs:inline text-xs font-medium">管理</span>
              </button>
            )}
          </div>
        </header>

        {/* ══ Hero Section ══ */}
        <section className="flex flex-col items-center justify-center px-4 pt-10 pb-8">
          <DigitalClock />
          <div className="mt-4 w-full max-w-lg text-center px-2">
            <Hitokoto />
          </div>
          <SocialButtons links={socialLinks} />
        </section>

        {/* ══ Navigation Content ══ */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-24">
          <div className="content-glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
            {categories.length === 0 ? (
              <div className="text-center py-16" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'var(--md-sys-color-surface-container)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 opacity-50">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                  </svg>
                </div>
                <p className="text-base font-medium mb-1">暂无导航内容</p>
                <p className="text-sm opacity-70">
                  {isAuthenticated ? '点击右下角 ⚙️ 添加分类和链接' : '请点击右上角「管理」登录'}
                </p>
              </div>
            ) : (
              <div>
                {categories.map(cat => (
                  <CategorySection
                    key={cat.id}
                    category={cat}
                    isAdmin={isAuthenticated}
                    onEditCategory={(c) => setDialogState({ type: 'cat_edit', cat: c })}
                    onDeleteCategory={async (id) => {
                      if (!confirm('确定删除此分类及其所有链接？')) return;
                      await deleteCategory(id);
                      showToast('分类已删除');
                    }}
                    onAddLink={(cid) => setDialogState({ type: 'link_add', categoryId: cid })}
                    onEditLink={(link) => setDialogState({ type: 'link_edit', link })}
                    onDeleteLink={async (id) => {
                      if (!confirm('确定删除此链接？')) return;
                      await deleteLink(id);
                      showToast('链接已删除');
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer
            className="text-center mt-6 text-xs"
            style={{ color: hasBg ? 'rgba(255,255,255,0.45)' : 'var(--md-sys-color-outline)' }}
          >
            {config.footer_html ? (
              <div
                className="footer-custom"
                dangerouslySetInnerHTML={{ __html: config.footer_html }}
              />
            ) : (
              <span>Powered by NavSite · Material Design 3</span>
            )}
          </footer>
        </main>
      </div>

      {/* ══ Login Dialog ══ */}
      {showLogin && (
        <LoginDialog
          onLogin={async (pw) => {
            const result = await login(pw);
            if (result.success) { setShowLogin(false); showToast('🎉 已进入管理模式'); }
            return result;
          }}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* ══ Admin Panel ══ */}
      {isAuthenticated && (
        <AdminPanel
          config={config}
          socialLinks={socialLinks}
          onUpdateConfig={async (data) => {
            const result = await updateConfig(data);
            if (result.success) showToast('✅ 设置已保存');
            return result;
          }}
          onAddSocial={async (data) => { await addSocial(data); showToast('✅ 社交链接已添加'); }}
          onUpdateSocial={async (id, data) => { await updateSocial(id, data); showToast('✅ 已更新'); }}
          onDeleteSocial={async (id) => { await deleteSocial(id); showToast('已删除'); }}
          onAddCategory={() => setDialogState({ type: 'cat_add' })}
          onLogout={() => { logout(); showToast('已退出管理模式'); }}
        />
      )}

      {/* ══ Edit Dialogs ══ */}
      {dialogState?.type === 'cat_add' && (
        <EditDialog title="📁 添加分类"
          fields={[
            { key: 'name', label: '分类名称', required: true, placeholder: '🔍 搜索引擎' },
            { key: 'description', label: '描述', type: 'markdown', placeholder: '支持 Markdown 格式...' },
            { key: 'icon', label: '图标 (Emoji)', type: 'emoji', placeholder: '🔍' },
            { key: 'sort_order', label: '排序权重', type: 'number', placeholder: '0' },
          ]}
          onSave={async (vals) => { await addCategory(vals as Partial<Category>); showToast('✅ 分类已添加'); }}
          onClose={() => setDialogState(null)}
        />
      )}

      {dialogState?.type === 'cat_edit' && (
        <EditDialog title="✏️ 编辑分类"
          fields={[
            { key: 'name', label: '分类名称', required: true },
            { key: 'description', label: '描述', type: 'markdown' },
            { key: 'icon', label: '图标 (Emoji)', type: 'emoji' },
            { key: 'sort_order', label: '排序权重', type: 'number' },
          ]}
          initialValues={dialogState.cat as unknown as Record<string, string | number>}
          onSave={async (vals) => { await updateCategory(dialogState.cat.id, vals as Partial<Category>); showToast('✅ 分类已更新'); }}
          onClose={() => setDialogState(null)}
        />
      )}

      {dialogState?.type === 'link_add' && (
        <EditDialog title="🔗 添加链接"
          fields={[
            { key: 'title', label: '链接标题', required: true, placeholder: 'Google' },
            { key: 'url', label: '链接地址', type: 'url', required: true, placeholder: 'https://google.com' },
            { key: 'description', label: '描述', type: 'markdown', placeholder: '支持 Markdown...' },
            { key: 'icon', label: '图标 (Emoji / 留空自动 favicon)', type: 'emoji', placeholder: '🌐' },
            { key: 'sort_order', label: '排序权重', type: 'number', placeholder: '0' },
          ]}
          initialValues={{ category_id: dialogState.categoryId }}
          onSave={async (vals) => {
            await addLink({ category_id: dialogState.categoryId, title: String(vals.title), url: String(vals.url), description: String(vals.description || ''), icon: String(vals.icon || ''), sort_order: Number(vals.sort_order || 0) });
            showToast('✅ 链接已添加');
          }}
          onClose={() => setDialogState(null)}
        />
      )}

      {dialogState?.type === 'link_edit' && (
        <EditDialog title="✏️ 编辑链接"
          fields={[
            { key: 'title', label: '链接标题', required: true },
            { key: 'url', label: '链接地址', type: 'url', required: true },
            { key: 'description', label: '描述', type: 'markdown' },
            { key: 'icon', label: '图标 (Emoji)', type: 'emoji' },
            { key: 'sort_order', label: '排序权重', type: 'number' },
          ]}
          initialValues={dialogState.link as unknown as Record<string, string | number>}
          onSave={async (vals) => {
            await updateLink(dialogState.link.id, { category_id: dialogState.link.category_id, title: String(vals.title), url: String(vals.url), description: String(vals.description || ''), icon: String(vals.icon || ''), sort_order: Number(vals.sort_order || 0) });
            showToast('✅ 链接已更新');
          }}
          onClose={() => setDialogState(null)}
        />
      )}

      {/* ══ Toast ══ */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] fade-in md3-snackbar whitespace-nowrap"
          style={{ pointerEvents: 'none' }}>
          {toast}
        </div>
      )}

      {/* ══ Auth Loading ══ */}
      {authLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <svg className="md3-progress-ring w-5 h-5" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--md-sys-color-primary)' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20"/>
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>验证中…</span>
          </div>
        </div>
      )}
    </div>
  );
}
