const { DEFAULT_THRESHOLDS } = require('../config/thresholds');

/**
 * Evaluates candidate release metrics against given or default thresholds.
 * 
 * @param {Object} candidateMetrics - Latest candidate metrics (requestCount, errorRate, avgResponseTimeMs, p95ResponseTimeMs, healthCheckStatus, consecutiveHealthCheckFailures)
 * @param {Object} [thresholds] - Custom thresholds (or uses DEFAULT_THRESHOLDS)
 * @returns {Object} Evaluation report with status, decision, failedRules, and summary
 */
function evaluateHealth(candidateMetrics, thresholds = {}) {
  const activeThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(thresholds || {})
  };

  const failedRules = [];
  const warnings = [];

  // 1. Health check endpoint status check
  const consecutiveFailures = candidateMetrics.consecutiveHealthCheckFailures || 0;
  const isFailingProbe = candidateMetrics.healthCheckStatus === 'FAILING';

  if (isFailingProbe || consecutiveFailures >= activeThresholds.maxConsecutiveHealthCheckFailures) {
    failedRules.push({
      rule: 'HEALTH_CHECK_FAILURE',
      threshold: `< ${activeThresholds.maxConsecutiveHealthCheckFailures} failure(s)`,
      actual: `${consecutiveFailures > 0 ? consecutiveFailures : 1} failure(s) (HTTP ${candidateMetrics.healthCheckStatusCode || 503})`,
      severity: 'CRITICAL',
      message: `Health check endpoint probe failed with status ${candidateMetrics.healthCheckStatusCode || 503}.`
    });
  }

  // 2. Minimum request check (prevent false positives on zero or trace traffic)
  const totalRequests = candidateMetrics.requestCount || 0;
  const minRequests = activeThresholds.minRequestsForEvaluation;

  if (totalRequests >= minRequests) {
    // Error rate evaluation
    const errorRate = candidateMetrics.errorRate || 0;
    if (errorRate > activeThresholds.maxErrorRatePercent) {
      failedRules.push({
        rule: 'ERROR_RATE_EXCEEDED',
        threshold: `<= ${activeThresholds.maxErrorRatePercent}%`,
        actual: `${errorRate}%`,
        severity: 'CRITICAL',
        message: `Candidate error rate of ${errorRate}% exceeds the critical threshold of ${activeThresholds.maxErrorRatePercent}%.`
      });
    } else if (errorRate > activeThresholds.warningErrorRatePercent) {
      warnings.push({
        rule: 'ERROR_RATE_WARNING',
        threshold: `<= ${activeThresholds.warningErrorRatePercent}%`,
        actual: `${errorRate}%`,
        severity: 'WARNING',
        message: `Candidate error rate of ${errorRate}% exceeds the warning threshold of ${activeThresholds.warningErrorRatePercent}%.`
      });
    }

    // p95 Latency evaluation
    const p95Latency = candidateMetrics.p95ResponseTimeMs || 0;
    if (p95Latency > activeThresholds.maxP95LatencyMs) {
      failedRules.push({
        rule: 'P95_LATENCY_EXCEEDED',
        threshold: `<= ${activeThresholds.maxP95LatencyMs}ms`,
        actual: `${p95Latency}ms`,
        severity: 'CRITICAL',
        message: `p95 response time of ${p95Latency}ms exceeds the critical ceiling of ${activeThresholds.maxP95LatencyMs}ms.`
      });
    } else if (p95Latency > activeThresholds.warningP95LatencyMs) {
      warnings.push({
        rule: 'P95_LATENCY_WARNING',
        threshold: `<= ${activeThresholds.warningP95LatencyMs}ms`,
        actual: `${p95Latency}ms`,
        severity: 'WARNING',
        message: `p95 response time of ${p95Latency}ms is above warning threshold of ${activeThresholds.warningP95LatencyMs}ms.`
      });
    }

    // Average latency evaluation
    const avgLatency = candidateMetrics.avgResponseTimeMs || 0;
    if (avgLatency > activeThresholds.maxAvgLatencyMs) {
      failedRules.push({
        rule: 'AVG_LATENCY_EXCEEDED',
        threshold: `<= ${activeThresholds.maxAvgLatencyMs}ms`,
        actual: `${avgLatency}ms`,
        severity: 'CRITICAL',
        message: `Average response time of ${avgLatency}ms exceeds threshold of ${activeThresholds.maxAvgLatencyMs}ms.`
      });
    }
  }

  // Determine overall status and recommendation
  let status = 'HEALTHY';
  let decision = 'PROCEED';
  let summary = 'All release health checks are within configured thresholds.';

  if (failedRules.length > 0) {
    status = 'UNHEALTHY';
    decision = 'ROLLBACK_RECOMMENDED';
    const primaryRule = failedRules[0];
    summary = `Release is unhealthy: ${primaryRule.message}`;
  } else if (warnings.length > 0) {
    status = 'WARNING';
    decision = 'PAUSE_AND_INVESTIGATE';
    summary = `Release warning: ${warnings[0].message}`;
  }

  return {
    status,
    decision,
    failedRules: [...failedRules, ...warnings],
    summary,
    evaluatedAt: new Date().toISOString(),
    thresholdsUsed: activeThresholds
  };
}

module.exports = {
  evaluateHealth
};
