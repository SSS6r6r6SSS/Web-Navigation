import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 从 localStorage 恢复登录态，不发起网络请求（避免卡死）
    const token = localStorage.getItem('nav_token');
    if (token) {
      setIsAuthenticated(true);
    }
    const onLogout = () => {
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = useCallback(async (
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { password });

      if (res.data?.success && res.data?.token) {
        localStorage.setItem('nav_token', res.data.token);
        setIsAuthenticated(true);
        return { success: true };
      }

      return {
        success: false,
        error: res.data?.error || '登录失败，请重试',
      };

    } catch (err: unknown) {
      console.error('[useAuth] login error:', err);

      // axios 网络错误
      type AxiosLike = {
        response?: { status?: number; data?: { error?: string } };
        request?: unknown;
        message?: string;
        code?: string;
      };
      const e = err as AxiosLike;

      if (e.response) {
        // 服务器返回了错误响应（4xx / 5xx）
        const serverMsg = e.response.data?.error;
        if (e.response.status === 401) {
          return { success: false, error: serverMsg || '密码错误' };
        }
        return { success: false, error: serverMsg || `服务器错误 (${e.response.status})` };
      }

      if (e.request) {
        // 请求已发出但未收到响应（超时、CORS、网络不通）
        if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
          return { success: false, error: '请求超时，请检查服务器是否正常运行' };
        }
        return { success: false, error: '无法连接到服务器，请确认后端进程已启动' };
      }

      // 其他错误
      return { success: false, error: e.message || '未知错误' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nav_token');
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, isLoading, login, logout };
}
