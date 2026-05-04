import axios from 'axios';
import { getApiUrl, getFallbackApiUrl, setApiFailed, isApiFailed } from '@/config';

const API_URL = getApiUrl() || '/api';
const FALLBACK_URL = getFallbackApiUrl();
const isAbsoluteApiUrl = /^https?:\/\//i.test(API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add cache buster to bypass aggressive 301 cached redirects from previous backend CORS bug
  if (config.method?.toLowerCase() === 'get') {
    config.params = { ...config.params, _cb: Date.now() };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If direct cross-origin call fails in browser, retry once through local /api proxy.
    if (
      error?.code === 'ERR_NETWORK' &&
      isAbsoluteApiUrl &&
      !error?.config?.__proxyRetried
    ) {
      return api.request({
        ...error.config,
        baseURL: '/api',
        __proxyRetried: true,
      });
    }

    // If primary API fails, try fallback URL
    if (
      (error?.code === 'ERR_NETWORK' || error?.response?.status >= 500) &&
      !error?.config?.__fallbackRetried &&
      !isApiFailed()
    ) {
      console.log('Primary API failed, trying fallback to localhost...');
      setApiFailed(true);
      return api.request({
        ...error.config,
        baseURL: FALLBACK_URL,
        __fallbackRetried: true,
      });
    }

    // Don't automatically logout on 401 - let components handle auth errors themselves
    // This prevents unwanted logout when user tries to access protected endpoints
    if (error.response?.status === 401) {
      // Only logout if explicitly on a protected page and not handling it manually
      // The component can handle the redirect itself
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;
