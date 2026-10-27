export function formatPercentage(val) {
  if (val === undefined || val === null || isNaN(val)) return '0.00%';
  return `${Number(val).toFixed(2)}%`;
}

export function formatLatency(val) {
  if (val === undefined || val === null || isNaN(val)) return '0 ms';
  return `${Math.round(val)} ms`;
}

export function formatNumber(val) {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat().format(val);
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  try {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return '—';
  }
}
