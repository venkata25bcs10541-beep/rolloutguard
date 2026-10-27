/**
 * Metric Calculator Service
 * Provides reliable, tested arithmetic for release monitoring metrics
 */

/**
 * Calculates error rate as a percentage bounded between 0 and 100.
 * Error rate = (failedRequests / totalRequests) * 100
 * @param {number} failed - Count of failed requests
 * @param {number} total - Total count of requests
 * @returns {number} Error rate percentage rounded to 2 decimal places
 */
function calculateErrorRate(failed, total) {
  if (!total || total <= 0) return 0;
  if (!failed || failed <= 0) return 0;
  const rate = (failed / total) * 100;
  return Math.min(100, Math.max(0, parseFloat(rate.toFixed(2))));
}

/**
 * Calculates p95 response time given a list of latencies or returns the supplied p95
 * @param {number[]} latencies
 * @returns {number}
 */
function calculateP95(latencies) {
  if (!latencies || latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)]);
}

/**
 * Compute difference and percentage delta between baseline and candidate metrics
 */
function compareMetrics(baseline, candidate) {
  const errorRateDelta = parseFloat((candidate.errorRate - baseline.errorRate).toFixed(2));
  const avgLatencyDelta = Math.round(candidate.avgResponseTimeMs - baseline.avgResponseTimeMs);
  const p95LatencyDelta = Math.round(candidate.p95ResponseTimeMs - baseline.p95ResponseTimeMs);

  return {
    errorRateDelta,
    avgLatencyDelta,
    p95LatencyDelta,
    healthCheckDegraded: baseline.healthCheckStatus === 'PASSING' && candidate.healthCheckStatus === 'FAILING'
  };
}

module.exports = {
  calculateErrorRate,
  calculateP95,
  compareMetrics
};
