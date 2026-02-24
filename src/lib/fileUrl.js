/**
 * Converts a relative /api/files/... URL to an absolute URL when VITE_API_BASE is set.
 * Used when deploying the frontend to a different origin than the backend (e.g. static hosting).
 */
const API_BASE = import.meta.env.VITE_API_BASE || '';

export function fileUrl(url) {
  if (!url) return url;
  if (API_BASE && typeof url === 'string' && url.startsWith('/api/')) {
    return API_BASE + url;
  }
  return url;
}
