/**
 * Default Rollout Health Threshold Configuration
 * 
 * Note: These are documented example defaults. Production environments
 * should tune these values based on actual SLA/SLO requirements.
 */
const DEFAULT_THRESHOLDS = {
  maxErrorRatePercent: 5.0,            // Unhealthy if error rate > 5.0%
  warningErrorRatePercent: 2.5,        // Warning if error rate > 2.5%
  maxP95LatencyMs: 1000,               // Unhealthy if p95 response time > 1000ms
  warningP95LatencyMs: 500,            // Warning if p95 response time > 500ms
  maxAvgLatencyMs: 400,                // Unhealthy if avg response time > 400ms
  maxConsecutiveHealthCheckFailures: 1,// Unhealthy if consecutive health probe fails
  minRequestsForEvaluation: 30         // Minimum candidate requests required before applying rate rules
};

module.exports = {
  DEFAULT_THRESHOLDS
};
