import { fetchJson } from './api';

export async function getDashboardData() {
  return fetchJson('/dashboard');
}

export async function getSystemHealth() {
  return fetchJson('/health');
}
