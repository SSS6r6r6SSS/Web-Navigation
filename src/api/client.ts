import axios from 'axios';

/**
 * 在生产环境（vite-plugin-singlefile 打包成单 HTML 文件）中，
 * 相对路径 /api 会基于当前页面的 origin，所以直接用 window.location.origin + /api
 * 可以保证无论通过什么域名/端口访问页面，API 请求都打到同一台服务器。
 *
 * 开发环境通过 VITE_API_URL 环境变量覆盖（指向 localhost:3001）。
 */
function resolveApiBase(): string {
  // 开发环境：使用 .env.development 中配置的地址
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl && envUrl !== '/api') {
    return envUrl;
  }
  // 生产环境（singlefile 打包）：动态取当前 origin，避免相对路径歧义
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
}

export const apiClient = axios.create({
  baseURL: resolveApiBase(),
  timeout: 30000,
  // ⚠️ 不要在这里设置全局 Content-Type！
  // 设置了会导致 FormData 上传时 boundary 丢失，multer 无法解析文件。
  // axios 会根据 body 类型自动选择正确的 Content-Type：
  //   - 普通对象 → application/json
  //   - FormData → multipart/form-data; boundary=xxx（自动生成 boundary）
});

// 每次请求前动态附加 token（避免 baseURL 缓存问题）
apiClient.interceptors.request.use((config) => {
  // 每次请求都重新计算 baseURL，防止 origin 在 singlefile 场景下被固化为空
  if (typeof window !== 'undefined') {
    const base = resolveApiBase();
    if (config.baseURL !== base) {
      config.baseURL = base;
    }
  }

  const token = localStorage.getItem('nav_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nav_token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
