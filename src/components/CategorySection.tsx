import { useState } from 'react';
import { NavCard } from './NavCard';
import type { Category, NavLink } from '../types';
import ReactMarkdown from 'react-markdown';

interface CategorySectionProps {
  category: Category;
  isAdmin?: boolean;
  onEditCategory?: (cat: Category) => void;
  onDeleteCategory?: (id: number) => void;
  onAddLink?: (categoryId: number) => void;
  onEditLink?: (link: NavLink) => void;
  onDeleteLink?: (id: number) => void;
}

export function CategorySection({
  category,
  isAdmin,
  onEditCategory,
  onDeleteCategory,
  onAddLink,
  onEditLink,
  onDeleteLink,
}: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="category-section fade-in">
      {/* ── Header Row ── */}
      <div className="category-header">

        {/* Left: collapse toggle + icon + title + count + desc */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="category-header-left"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {/* Emoji icon */}
          {category.icon && (
            <div className="category-icon">
              {category.icon}
            </div>
          )}

          {/* Title */}
          <h2 className="category-title">{category.name}</h2>

          {/* Count badge */}
          <span className="category-badge">{category.links.length}</span>

          {/* Description — only on sm+ */}
          {category.description && (
            <div className="category-desc markdown-content hidden sm:block">
              <ReactMarkdown components={{ p: ({ children }) => <span>— {children}</span> }}>
                {category.description}
              </ReactMarkdown>
            </div>
          )}

          {/* Collapse chevron */}
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            className="category-chevron"
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Right: admin actions */}
        {isAdmin && (
          <div className="category-actions">
            <button
              onClick={() => onAddLink?.(category.id)}
              className="md3-btn md3-btn-tonal"
              style={{ height: 30, padding: '0 10px', fontSize: 12, gap: 4 }}
              title="添加链接"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span className="hidden sm:inline">添加</span>
            </button>
            <button
              onClick={() => onEditCategory?.(category)}
              className="md3-icon-btn"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'var(--md-sys-color-surface-container-high)',
              }}
              title="编辑分类"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"
                style={{ color: 'var(--md-sys-color-secondary)' }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              onClick={() => onDeleteCategory?.(category.id)}
              className="md3-icon-btn"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'var(--md-sys-color-error-container)',
              }}
              title="删除分类"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"
                style={{ color: 'var(--md-sys-color-error)' }}>
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="category-divider" />

      {/* ── Link List ── */}
      {!collapsed && (
        <div className="category-list">
          {category.links.map(link => (
            <NavCard
              key={link.id}
              link={link}
              isAdmin={isAdmin}
              onEdit={onEditLink}
              onDelete={onDeleteLink}
            />
          ))}
          {category.links.length === 0 && (
            <div className="category-empty">
              {isAdmin ? (
                <>
                  <p className="mb-2 text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>暂无链接</p>
                  <button
                    onClick={() => onAddLink?.(category.id)}
                    className="md3-btn md3-btn-tonal text-xs"
                    style={{ height: 30, padding: '0 14px' }}
                  >
                    + 添加第一个链接
                  </button>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>暂无链接</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
