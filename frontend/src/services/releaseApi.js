import { fetchJson } from './api';

export async function getReleases(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.status) query.set('status', params.status);
  if (params.appName) query.set('appName', params.appName);
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  return fetchJson(`/releases${qs ? `?${qs}` : ''}`);
}

export async function getReleaseById(id) {
  return fetchJson(`/releases/${id}`);
}

export async function createRelease(payload) {
  return fetchJson('/releases', {
    method: 'POST',
    body: payload
  });
}

export async function startRollout(id) {
  return fetchJson(`/releases/${id}/start`, {
    method: 'POST'
  });
}

export async function pauseRollout(id) {
  return fetchJson(`/releases/${id}/pause`, {
    method: 'POST'
  });
}

export async function resumeRollout(id) {
  return fetchJson(`/releases/${id}/resume`, {
    method: 'POST'
  });
}

export async function cancelRollout(id, reason) {
  return fetchJson(`/releases/${id}/cancel`, {
    method: 'POST',
    body: { reason }
  });
}

export async function rollbackRelease(id, reason) {
  return fetchJson(`/releases/${id}/rollback`, {
    method: 'POST',
    body: { reason }
  });
}

export async function getReleaseEvents(id) {
  return fetchJson(`/releases/${id}/events`);
}

export async function getReleaseMetrics(id) {
  return fetchJson(`/releases/${id}/metrics`);
}
