const { calculateErrorRate } = require('./metricCalculator');
const { evaluateHealth } = require('./healthEvaluator');

/**
 * Simulation Engine for generating coherent, reproducible metrics
 * across all deployment scenarios and rollout percentages.
 */

const TOTAL_WINDOW_REQUESTS = 1000;

/**
 * Generate simulated metrics for a given scenario, rollout percentage, and versions.
 * 
 * @param {string} scenario - One of 'healthy', 'error_spike', 'slow_api', 'service_failure', 'gradual_degradation', 'recovery_after_rollback'
 * @param {number} rolloutPercentage - 0, 5, 25, 50, 100
 * @param {string} baselineVersion - e.g. "v1.9.0"
 * @param {string} candidateVersion - e.g. "v2.0.0"
 * @param {Object} [customThresholds] - Custom thresholds for evaluation
 */
function generateScenarioMetrics(
  scenario = 'healthy',
  rolloutPercentage = 5,
  baselineVersion = 'v1.0.0',
  candidateVersion = 'v1.1.0',
  customThresholds = {}
) {
  const candidateShare = rolloutPercentage / 100;
  const baselineShare = Math.max(0, 1 - candidateShare);

  const candidateRequests = Math.round(TOTAL_WINDOW_REQUESTS * candidateShare);
  const baselineRequests = Math.round(TOTAL_WINDOW_REQUESTS * baselineShare);

  // Baseline is always a healthy, stable benchmark
  const baselineFailed = Math.round(baselineRequests * 0.012); // ~1.2% baseline error rate
  const baselineSuccessful = baselineRequests - baselineFailed;
  const baseline = {
    version: baselineVersion,
    requestCount: baselineRequests,
    successfulRequests: baselineSuccessful,
    failedRequests: baselineFailed,
    errorRate: calculateErrorRate(baselineFailed, baselineRequests),
    avgResponseTimeMs: 110,
    p95ResponseTimeMs: 220,
    healthCheckStatus: 'PASSING',
    healthCheckStatusCode: 200,
    consecutiveHealthCheckFailures: 0
  };

  // Candidate metric generation based on selected scenario and rollout percentage
  let candidateFailed = 0;
  let candidateAvgLatency = 115;
  let candidateP95Latency = 230;
  let candidateHealthStatus = 'PASSING';
  let candidateStatusCode = 200;
  let candidateHealthFailures = 0;

  switch (scenario) {
    case 'error_spike': {
      // API errors spike sharply to ~18.5%
      const errorFraction = 0.185;
      candidateFailed = Math.round(candidateRequests * errorFraction);
      candidateAvgLatency = 160;
      candidateP95Latency = 380;
      candidateHealthStatus = 'PASSING';
      candidateStatusCode = 200;
      candidateHealthFailures = 0;
      break;
    }

    case 'slow_api': {
      // API error rate remains normal (~1.1%), but response times spike drastically
      const errorFraction = 0.011;
      candidateFailed = Math.round(candidateRequests * errorFraction);
      candidateAvgLatency = 680;
      candidateP95Latency = 1580; // Above 1000ms threshold
      candidateHealthStatus = 'PASSING';
      candidateStatusCode = 200;
      candidateHealthFailures = 0;
      break;
    }

    case 'service_failure': {
      // Health check endpoint probe fails (HTTP 503 / 500)
      const errorFraction = 0.095;
      candidateFailed = Math.round(candidateRequests * errorFraction);
      candidateAvgLatency = 320;
      candidateP95Latency = 720;
      candidateHealthStatus = 'FAILING';
      candidateStatusCode = 503;
      candidateHealthFailures = 2; // Exceeds max consecutive failures
      break;
    }

    case 'gradual_degradation': {
      // Metrics worsen as traffic scales:
      // 5%: mild (2% errors, 310ms p95)
      // 25%: warning (3.8% errors, 580ms p95)
      // 50%+: critical (11.5% errors, 1420ms p95)
      let errorFraction = 0.02;
      if (rolloutPercentage <= 5) {
        errorFraction = 0.02;
        candidateAvgLatency = 140;
        candidateP95Latency = 310;
      } else if (rolloutPercentage <= 25) {
        errorFraction = 0.038;
        candidateAvgLatency = 280;
        candidateP95Latency = 580;
      } else {
        errorFraction = 0.115;
        candidateAvgLatency = 590;
        candidateP95Latency = 1420;
      }
      candidateFailed = Math.round(candidateRequests * errorFraction);
      candidateHealthStatus = 'PASSING';
      candidateStatusCode = 200;
      candidateHealthFailures = 0;
      break;
    }

    case 'recovery_after_rollback': {
      // Metrics return back to healthy values after rollback
      const errorFraction = 0.008; // ~0.8% error rate
      candidateFailed = Math.round(candidateRequests * errorFraction);
      candidateAvgLatency = 105;
      candidateP95Latency = 205;
      candidateHealthStatus = 'PASSING';
      candidateStatusCode = 200;
      candidateHealthFailures = 0;
      break;
    }

    case 'healthy':
    default: {
      // Normal healthy release (< 1.5% errors, < 250ms p95, passing probes)
      const errorFraction = 0.009; // ~0.9% error rate
      candidateFailed = Math.round(candidateRequests * errorFraction);
      candidateAvgLatency = 112;
      candidateP95Latency = 225;
      candidateHealthStatus = 'PASSING';
      candidateStatusCode = 200;
      candidateHealthFailures = 0;
      break;
    }
  }

  const candidateSuccessful = Math.max(0, candidateRequests - candidateFailed);
  const candidateErrorRate = calculateErrorRate(candidateFailed, candidateRequests);

  const candidate = {
    version: candidateVersion,
    requestCount: candidateRequests,
    successfulRequests: candidateSuccessful,
    failedRequests: candidateFailed,
    errorRate: candidateErrorRate,
    avgResponseTimeMs: candidateAvgLatency,
    p95ResponseTimeMs: candidateP95Latency,
    healthCheckStatus: candidateHealthStatus,
    healthCheckStatusCode: candidateStatusCode,
    consecutiveHealthCheckFailures: candidateHealthFailures
  };

  // Evaluate candidate health against thresholds
  const evaluation = evaluateHealth(candidate, customThresholds);

  return {
    rolloutPercentage,
    stage: `stage-${rolloutPercentage}%`,
    isSimulated: true,
    baseline,
    candidate,
    evaluation
  };
}

/**
 * Generate post-rollback recovery metrics showing traffic restored to stable baseline
 */
function generateRollbackRecoveryMetrics(baselineVersion, candidateVersion) {
  const totalRequests = TOTAL_WINDOW_REQUESTS;
  const failedRequests = Math.round(totalRequests * 0.008); // 0.8% error rate
  const successfulRequests = totalRequests - failedRequests;

  const restoredBaseline = {
    version: baselineVersion,
    requestCount: totalRequests,
    successfulRequests,
    failedRequests,
    errorRate: calculateErrorRate(failedRequests, totalRequests),
    avgResponseTimeMs: 108,
    p95ResponseTimeMs: 215,
    healthCheckStatus: 'PASSING',
    healthCheckStatusCode: 200,
    consecutiveHealthCheckFailures: 0
  };

  const candidate = {
    version: candidateVersion,
    requestCount: 0,
    successfulRequests: 0,
    failedRequests: 0,
    errorRate: 0,
    avgResponseTimeMs: 0,
    p95ResponseTimeMs: 0,
    healthCheckStatus: 'PASSING',
    healthCheckStatusCode: 200,
    consecutiveHealthCheckFailures: 0
  };

  return {
    rolloutPercentage: 0,
    stage: 'post-rollback-recovery',
    isSimulated: true,
    baseline: restoredBaseline,
    candidate,
    evaluation: {
      status: 'HEALTHY',
      decision: 'PROCEED',
      failedRules: [],
      summary: 'Traffic successfully returned 100% to stable baseline. Metrics restored to normal healthy bounds.',
      evaluatedAt: new Date().toISOString()
    }
  };
}

module.exports = {
  generateScenarioMetrics,
  generateRollbackRecoveryMetrics
};
