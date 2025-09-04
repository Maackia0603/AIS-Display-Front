import { useCallback, useRef, useState } from 'react';

/**
 * 通用请求 Hook
 * @param {Object} options
 * @param {string} options.url
 * @param {string} [options.method='GET']
 * @param {Object} [options.headers]
 * @param {any} [options.body]
 * @param {boolean} [options.lazy=false] - 是否懒加载（手动触发）
 */
export default function useRequest(options = {}) {
  const { url, method = 'GET', headers = {}, body, lazy = false } = options;

  const [isLoading, setIsLoading] = useState(!lazy);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const abortRef = useRef(null);

  const doFetch = useCallback(async (override = {}) => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const resp = await fetch(override.url || url, {
        method: (override.method || method).toUpperCase(),
        headers: { 'Content-Type': 'application/json', ...headers, ...(override.headers || {}) },
        body: override.body !== undefined ? override.body : body,
        signal: controller.signal,
      });

      const contentType = resp.headers.get('content-type') || '';
      const payload = contentType.includes('application/json') ? await resp.json() : await resp.text();

      if (!resp.ok) {
        const err = new Error(typeof payload === 'string' ? payload : (payload?.message || 'Request failed'));
        err.status = resp.status;
        throw err;
      }

      setData(payload);
      return payload;
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [url, method, headers, body]);

  // 若非懒加载，初始化即请求
  // 交由使用方决定是否需要初始请求，这里保持默认 lazy=true 的用法

  return { isLoading, error, data, doFetch, setData };
}
