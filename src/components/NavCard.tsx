import ReactMarkdown from 'react-markdown';
import type { NavLink } from '../types';

interface NavCardProps {
  link: NavLink;
  isAdmin?: boolean;
  onEdit?: (link: NavLink) => void;
  onDelete?: (id: number) => void;
}

function getFavicon(url: string) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return null;
  }
}

export function NavCard({ link, isAdmin, onEdit, onDelete }: NavCardProps) {
  const favicon = getFavicon(link.url);
  const isEmoji = link.icon && link.icon.length <= 4 && !link.icon.startsWith('http');

  return (
    <div className="nav-row group">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-row-link"
      >
        {/* Icon */}
        <div className="nav-row-icon">
          {isEmoji ? (
            <span className="text-lg leading-none">{link.icon}</span>
          ) : favicon ? (
            <img
              src={favicon}
              alt={link.title}
              className="w-5 h-5 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth={1.5} className="w-4 h-4">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
          )}
        </div>

        {/* Title */}
        <div className="nav-row-title">
          <span className="nav-row-name">{link.title}</span>
          {link.description && (
            <div className="nav-row-desc markdown-content">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--md-sys-color-primary)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      {children}
                    </a>
                  ),
                  p: ({ children }) => <span>{children}</span>,
                }}
              >
                {link.description}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* URL hint */}
        <div className="nav-row-url">
          {(() => { try { return new URL(link.url).hostname; } catch { return ''; } })()}
        </div>

        {/* Arrow */}
        <div className="nav-row-arrow" style={{ color: 'var(--md-sys-color-primary)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M7 17L17 7M17 7H7M17 7v10"/>
          </svg>
        </div>
      </a>

      {/* Admin actions */}
      {isAdmin && (
        <div className="nav-row-admin">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(link); }}
            className="md3-icon-btn"
            style={{
              width: 28, height: 28,
              background: 'var(--md-sys-color-secondary-container)',
              color: 'var(--md-sys-color-on-secondary-container)',
              borderRadius: 8,
            }}
            title="编辑"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(link.id); }}
            className="md3-icon-btn"
            style={{
              width: 28, height: 28,
              background: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
              borderRadius: 8,
            }}
            title="删除"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
