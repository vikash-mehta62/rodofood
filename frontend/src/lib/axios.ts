import axios from 'axios';
import { API_URL } from '@/lib/config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Get token from all possible sources in priority order
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  // 1. Direct localStorage key (set on login)
  const direct = localStorage.getItem('rf_token');
  if (direct) return direct;

  // 2. Zustand persisted store key
  try {
    const raw = localStorage.getItem('rf_auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token) {
        localStorage.setItem('rf_token', token);
        return token;
      }
    }
  } catch { /* ignore */ }

  // 3. Cookie fallback (rf_token cookie set by authStore syncCookie)
  try {
    const match = document.cookie.match(/(?:^|;\s*)rf_token=([^;]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch { /* ignore */ }

  return null;
};

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — don't redirect on payment routes, let the component handle it
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url: string = error.config?.url ?? '';
      const isPaymentRoute = url.includes('/payments/');
      if (!isPaymentRoute) {
        localStorage.removeItem('rf_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
