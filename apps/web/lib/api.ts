import { supabase } from './supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// In-flight request deduplication map to prevent redundant concurrent fetches
const inFlightRequests = new Map<string, Promise<Response>>();

// Short-term in-memory cache (10 seconds) for GET requests
const memoryCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL_MS = 10_000;

/**
 * Clear in-memory cache on mutations (POST, PUT, PATCH, DELETE)
 */
export function invalidateApiCache(pattern?: string) {
  if (!pattern) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }
  }
}

/**
 * Authenticated API Fetcher
 * Automatically resolves the Supabase access token, attaches it to outgoing requests,
 * deduplicates concurrent requests, and caches recent responses.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const method = (options.method || 'GET').toUpperCase();

  // On mutations, clear cached responses immediately
  if (method !== 'GET') {
    invalidateApiCache();
  }

  const headers = new Headers(options.headers || {});

  // Automatically attach Supabase JWT if a session is active
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      // Session fetch error fallback
    }
  }

  // For GET requests, check short-term memory cache
  if (method === 'GET') {
    const authKey = headers.get('Authorization') || 'anon';
    const cacheKey = `${url}|${authKey}`;
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new Response(cached.data, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-SuperSave-Cache': 'HIT' },
      });
    }

    // Deduplicate concurrent in-flight GET requests
    if (inFlightRequests.has(cacheKey)) {
      const existing = inFlightRequests.get(cacheKey)!;
      return existing.then((r) => r.clone());
    }

    const fetchPromise = fetch(url, { ...options, headers })
      .then(async (res) => {
        if (res.ok) {
          try {
            const cloned = res.clone();
            const text = await cloned.text();
            memoryCache.set(cacheKey, { data: text, timestamp: Date.now() });
          } catch {}
        }
        return res;
      })
      .finally(() => {
        inFlightRequests.delete(cacheKey);
      });

    inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise.then((r) => r.clone());
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

