import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import type { Hitokoto as HitokotoType } from '../types';

export function Hitokoto() {
  const [data, setData]         = useState<HitokotoType | null>(null);
  const [loading, setLoading]   = useState(true);
  const [flipping, setFlipping] = useState(false);

  const fetchQuote = useCallback(async () => {
    if (flipping) return;
    setFlipping(true);
    setLoading(true);
    try {
      const res = await apiClient.get('/hitokoto');
      setData(res.data);
    } catch {
      setData({ hitokoto: '每一天都是新的开始。', from: '佚名' });
    } finally {
      setLoading(false);
      setTimeout(() => setFlipping(false), 400);
    }
  }, [flipping]);

  useEffect(() => { fetchQuote(); }, []); // eslint-disable-line

  return (
    <div
      className="quote-card cursor-pointer group select-none mt-5 w-full"
      style={{ maxWidth: 520 }}
      onClick={fetchQuote}
      title="点击换一句"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-1">
          <svg
            className="md3-progress-ring w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: 'var(--quote-accent)' }}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
          </svg>
          <span className="text-sm font-light" style={{ color: 'var(--quote-text-sub)' }}>
            加载每日一言…
          </span>
        </div>
      ) : data ? (
        <div
          className={`text-center transition-all duration-300 ${
            flipping ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Quote mark decoration */}
          <div className="quote-mark" aria-hidden="true">"</div>

          <p className="quote-text">
            {data.hitokoto}
          </p>

          {(data.from || data.from_who) && (
            <p className="quote-source mt-2">
              —— {data.from_who ? `${data.from_who}` : ''}
              {data.from ? `《${data.from}》` : ''}
            </p>
          )}

          {/* Refresh hint */}
          <div className="flex items-center justify-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-3 h-3"
              style={{ color: 'var(--quote-accent)' }}
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-xs font-medium" style={{ color: 'var(--quote-accent)' }}>
              换一句
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
