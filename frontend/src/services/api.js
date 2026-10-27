const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'https://rolloutguard-2.onrender.com/api';
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
