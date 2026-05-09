import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import type { Category, SiteConfig, SocialLink } from '../types';

const DEFAULT_CONFIG: SiteConfig = {
  site_title: '我的导航站',
  site_subtitle: '简洁 · 高效 · 美观',
  site_icon: '🧭',
  bg_image: '',
  bg_overlay: '0.3',
  hitokoto_enabled: 'true',
  footer_html: '',
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
};

export function useData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, socialRes, configRes] = await Promise.all([
        apiClient.get('/categories'),
        apiClient.get('/social'),
        apiClient.get('/config'),
      ]);
      setCategories(catRes.data || []);
      setSocialLinks(socialRes.data || []);
      setConfig({ ...DEFAULT_CONFIG, ...(configRes.data || {}) });
    } catch (err: unknown) {
      console.error('Failed to fetch data:', err);
      setError('无法连接到服务器，请确保后端已启动');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateConfig = useCallback(async (updates: Partial<SiteConfig>) => {
    try {
      const res = await apiClient.put('/config', updates);
      setConfig(prev => ({ ...prev, ...res.data }));
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: '更新配置失败' };
    }
  }, []);

  // Category CRUD
  const addCategory = useCallback(async (data: Partial<Category>) => {
    const res = await apiClient.post('/categories', data);
    setCategories(prev => [...prev, { ...res.data, links: [] }]);
    return res.data;
  }, []);

  const updateCategory = useCallback(async (id: number, data: Partial<Category>) => {
    const res = await apiClient.put(`/categories/${id}`, data);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...res.data } : c));
    return res.data;
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    await apiClient.delete(`/categories/${id}`);
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // Link CRUD
  const addLink = useCallback(async (data: {
    category_id: number | null;
    title: string;
    url: string;
    description?: string;
    icon?: string;
    sort_order?: number;
  }) => {
    const res = await apiClient.post('/links', data);
    setCategories(prev => prev.map(c => {
      if (c.id === data.category_id) {
        return { ...c, links: [...c.links, res.data] };
      }
      return c;
    }));
    return res.data;
  }, []);

  const updateLink = useCallback(async (id: number, data: {
    category_id?: number | null;
    title?: string;
    url?: string;
    description?: string;
    icon?: string;
    sort_order?: number;
  }) => {
    const res = await apiClient.put(`/links/${id}`, data);
    setCategories(prev => prev.map(c => ({
      ...c,
      links: c.links.map(l => l.id === id ? { ...l, ...res.data } : l),
    })));
    return res.data;
  }, []);

  const deleteLink = useCallback(async (id: number) => {
    await apiClient.delete(`/links/${id}`);
    setCategories(prev => prev.map(c => ({
      ...c,
      links: c.links.filter(l => l.id !== id),
    })));
  }, []);

  // Social CRUD
  const addSocial = useCallback(async (data: Partial<SocialLink>) => {
    const res = await apiClient.post('/social', data);
    setSocialLinks(prev => [...prev, res.data]);
    return res.data;
  }, []);

  const updateSocial = useCallback(async (id: number, data: Partial<SocialLink>) => {
    const res = await apiClient.put(`/social/${id}`, data);
    setSocialLinks(prev => prev.map(s => s.id === id ? { ...s, ...res.data } : s));
    return res.data;
  }, []);

  const deleteSocial = useCallback(async (id: number) => {
    await apiClient.delete(`/social/${id}`);
    setSocialLinks(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    categories, setCategories,
    socialLinks, setSocialLinks,
    config, setConfig,
    loading, error,
    fetchAll,
    updateConfig,
    addCategory, updateCategory, deleteCategory,
    addLink, updateLink, deleteLink,
    addSocial, updateSocial, deleteSocial,
  };
}
