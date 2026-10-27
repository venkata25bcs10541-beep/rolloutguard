import { fetchJson } from './api';

export async function getSettings() {
  return fetchJson('/settings');
}

export async function updateThresholds(thresholds) {
  return fetchJson('/settings/thresholds', {
    method: 'PUT',
    body: thresholds
  });
}

export async function resetThresholds() {
  return fetchJson('/settings/reset', {
    method: 'POST'
  });
}
