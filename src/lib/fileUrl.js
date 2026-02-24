/**
 * Converts a relative /api/files/... URL to an absolute URL when VITE_API_BASE is set,
 * and appends the Firebase auth token so <img>/<video>/<audio> tags can authenticate.
 */
const API_BASE = import.meta.env.VITE_API_BASE || '';

let _cachedToken = null;
let _tokenExpiry = 0;

/**
 * Sets the current Firebase ID token for use in file URLs.
 * Call this from AuthContext whenever the user or token refreshes.
 */
export function setFileToken(token) {
  _cachedToken = token;
  // Firebase tokens live ~1 hour; cache for 55 min to refresh early
  _tokenExpiry = token ? Date.now() + 55 * 60 * 1000 : 0;
}

export function fileUrl(url) {
  if (!url) return url;
  let result = url;
  if (API_BASE && typeof url === 'string' && url.startsWith('/api/')) {
    result = API_BASE + url;
  }
  // Append auth token for /api/files/ URLs so <img>/<video>/<audio> tags can authenticate
  if (_cachedToken && typeof result === 'string' && result.includes('/api/files/') && !result.includes('token=')) {
    const separator = result.includes('?') ? '&' : '?';
    result = result + separator + 'token=' + encodeURIComponent(_cachedToken);
  }
  return result;
}
