// Use /api by default so Vercel's vercel.json edge proxy routes directly to Render with zero CORS
let RAW_BASE = '/api';

const envBase = import.meta.env.VITE_API_BASE_URL;
if (envBase && !envBase.includes('rolloutguard-1')) {
  RAW_BASE = envBase;
}

// Ensure /api suffix if pointing directly to an external host
if (RAW_BASE.startsWith('http') && !RAW_BASE.endsWith('/api')) {
  RAW_BASE = `${RAW_BASE.replace(/\/+$/, '')}/api`;
}

const API_BASE = RAW_BASE.replace(/\/+$/, '');

/**
 * Base HTTP fetch wrapper with standardized error handling
 */
export async function fetchJson(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${cleanEndpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Received non-JSON response from server. Check API URL.');
  }

  if (!response.ok || (data && data.success === false)) {
    const error = new Error((data && data.message) || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
