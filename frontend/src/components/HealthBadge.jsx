import React from 'react';
import { getStatusStyle } from '../utils/statusStyles';

export default function HealthBadge({ status, size = 'sm', className = '' }) {
  const style = getStatusStyle(status);
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : size === 'md' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style.badge} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{status || 'Unknown'}</span>
    </span>
  );
}
