export function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'promoted':
    case 'healthy':
    case 'passing':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
        label: 'Healthy'
      };

    case 'running':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        dot: 'bg-blue-500 animate-pulse',
        label: 'Running'
      };

    case 'warning':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        dot: 'bg-amber-500',
        label: 'Warning'
      };

    case 'degraded':
    case 'unhealthy':
    case 'failing':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        dot: 'bg-rose-500',
        label: 'Degraded'
      };

    case 'rolled back':
    case 'rolled_back':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
        dot: 'bg-purple-500',
        label: 'Rolled Back'
      };

    case 'cancelled':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        badge: 'bg-slate-200 text-slate-700 border-slate-300',
        dot: 'bg-slate-400',
        label: 'Cancelled'
      };

    case 'draft':
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
        dot: 'bg-slate-400',
        label: 'Draft'
      };
  }
}

export const SCENARIO_DESCRIPTIONS = {
  healthy: {
    title: 'Healthy Release',
    description: 'Low error rate (<1%) and fast response times (~110ms). Expected to progress smoothly to 100%.',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  error_spike: {
    title: 'Error Spike',
    description: 'API errors spike to ~18% after deployment. Evaluator halts rollout and recommends immediate rollback.',
    badge: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  slow_api: {
    title: 'Slow API',
    description: 'Average latency increases to ~680ms and p95 spikes past 1,500ms, triggering latency limits.',
    badge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  service_failure: {
    title: 'Service Failure',
    description: 'Health check probe fails with HTTP 503 error, violating consecutive probe failure limits.',
    badge: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  gradual_degradation: {
    title: 'Gradual Degradation',
    description: 'Metrics begin acceptable at 5% but degrade as traffic scales, crossing critical thresholds at 50%.',
    badge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  recovery_after_rollback: {
    title: 'Recovery After Rollback',
    description: 'Demonstrates immediate recovery to stable baseline metrics following rollback confirmation.',
    badge: 'bg-purple-50 text-purple-700 border-purple-200'
  }
};
