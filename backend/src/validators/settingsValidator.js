function validateThresholds(req, res, next) {
  const {
    maxErrorRatePercent,
    warningErrorRatePercent,
    maxP95LatencyMs,
    warningP95LatencyMs,
    maxAvgLatencyMs,
    maxConsecutiveHealthCheckFailures,
    minRequestsForEvaluation
  } = req.body;

  const errors = [];

  if (maxErrorRatePercent !== undefined && (typeof maxErrorRatePercent !== 'number' || maxErrorRatePercent < 0 || maxErrorRatePercent > 100)) {
    errors.push('maxErrorRatePercent must be a number between 0 and 100');
  }

  if (warningErrorRatePercent !== undefined && (typeof warningErrorRatePercent !== 'number' || warningErrorRatePercent < 0 || warningErrorRatePercent > 100)) {
    errors.push('warningErrorRatePercent must be a number between 0 and 100');
  }

  if (maxErrorRatePercent !== undefined && warningErrorRatePercent !== undefined && warningErrorRatePercent > maxErrorRatePercent) {
    errors.push('warningErrorRatePercent cannot be greater than maxErrorRatePercent');
  }

  if (maxP95LatencyMs !== undefined && (typeof maxP95LatencyMs !== 'number' || maxP95LatencyMs <= 0)) {
    errors.push('maxP95LatencyMs must be a positive number');
  }

  if (warningP95LatencyMs !== undefined && (typeof warningP95LatencyMs !== 'number' || warningP95LatencyMs <= 0)) {
    errors.push('warningP95LatencyMs must be a positive number');
  }

  if (maxP95LatencyMs !== undefined && warningP95LatencyMs !== undefined && warningP95LatencyMs > maxP95LatencyMs) {
    errors.push('warningP95LatencyMs cannot be greater than maxP95LatencyMs');
  }

  if (maxAvgLatencyMs !== undefined && (typeof maxAvgLatencyMs !== 'number' || maxAvgLatencyMs <= 0)) {
    errors.push('maxAvgLatencyMs must be a positive number');
  }

  if (maxConsecutiveHealthCheckFailures !== undefined && (typeof maxConsecutiveHealthCheckFailures !== 'number' || maxConsecutiveHealthCheckFailures < 1)) {
    errors.push('maxConsecutiveHealthCheckFailures must be an integer >= 1');
  }

  if (minRequestsForEvaluation !== undefined && (typeof minRequestsForEvaluation !== 'number' || minRequestsForEvaluation < 1)) {
    errors.push('minRequestsForEvaluation must be an integer >= 1');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for thresholds',
      errors
    });
  }

  next();
}

module.exports = {
  validateThresholds
};
