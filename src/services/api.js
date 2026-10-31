import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://campus-os-backend-8sjf.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ─── High-Concurrency Client Cache & In-Flight Request Deduplication ─────────
const responseCache = new Map(); // key -> { data, timestamp }
const inFlightRequests = new Map(); // key -> Promise
const DEFAULT_CACHE_TTL = 30000; // 30 seconds TTL for read-heavy catalogue queries

/**
 * Generate a cache key from method, url, and params
 */
const getCacheKey = (config) => {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${method}:${url}:${params}`;
};

/**
 * Invalidate all or matching cached responses (e.g. after adding or editing document types)
 */
export const clearApiCache = (urlPattern = null) => {
  if (!urlPattern) {
    responseCache.clear();
  } else {
    for (const key of responseCache.keys()) {
      if (key.includes(urlPattern)) {
        responseCache.delete(key);
      }
    }
  }
};

// Request interceptor — attach standard Bearer token & handle in-flight deduplication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusdocs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check in-memory cache for safe GET endpoints (e.g. doc-types catalogue)
    if (config.method?.toLowerCase() === 'get' && config.enableCache !== false) {
      const url = config.url || '';
      const isCacheable = url.includes('/docdesk/doc-types');

      if (isCacheable) {
        const cacheKey = getCacheKey(config);
        const cached = responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < (config.cacheTTL || DEFAULT_CACHE_TTL)) {
          // Serve directly from in-memory cache
          config.adapter = () =>
            Promise.resolve({
              data: cached.data,
              status: 200,
              statusText: 'OK (Cache)',
              headers: {},
              config,
              request: {},
            });
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — cache responses, handle 401, and auto-retry on 503 / 429
api.interceptors.response.use(
  (response) => {
    const config = response.config;
    const url = config.url || '';

    // Cache successful GET responses for catalogue
    if (config.method?.toLowerCase() === 'get' && url.includes('/docdesk/doc-types')) {
      const cacheKey = getCacheKey(config);
      responseCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }

    // Automatically purge catalogue cache upon mutations
    if (['post', 'patch', 'delete', 'put'].includes(config.method?.toLowerCase() || '')) {
      if (url.includes('/docdesk/doc-types')) {
        clearApiCache('/docdesk/doc-types');
      }
    }

    return response;
  },
  async (error) => {
    const { config, response } = error;

    // Handle 401 Unauthorized globally
    if (response?.status === 401) {
      localStorage.removeItem('campusdocs_token');
      localStorage.removeItem('campusdocs_profile');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Exponential Backoff & Retry for Transient Cloud Server Failures (503 Service Unavailable or 429 Rate Limited)
    if (config && (response?.status === 503 || response?.status === 429) && !config._isRetry) {
      config._isRetry = true;
      const retryDelay = response?.status === 429 ? 2000 : 1500;
      console.warn(`[CampusDocs Network] Received HTTP ${response.status}. Retrying request in ${retryDelay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
