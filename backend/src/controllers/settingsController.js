const ThresholdConfig = require('../models/ThresholdConfig');
const { DEFAULT_THRESHOLDS } = require('../config/thresholds');

/**
 * GET /api/settings
 * Retrieves global health thresholds and configuration info
 */
async function getSettings(req, res, next) {
  try {
    let config = await ThresholdConfig.findOne({ isGlobal: true }).lean();

    if (!config) {
      // Upsert default global config
      config = await ThresholdConfig.create({
        isGlobal: true,
        ...DEFAULT_THRESHOLDS
      });
      config = config.toObject();
    }

    res.json({
      success: true,
      data: {
        thresholds: {
          maxErrorRatePercent: config.maxErrorRatePercent,
          warningErrorRatePercent: config.warningErrorRatePercent,
          maxP95LatencyMs: config.maxP95LatencyMs,
          warningP95LatencyMs: config.warningP95LatencyMs,
          maxAvgLatencyMs: config.maxAvgLatencyMs,
          maxConsecutiveHealthCheckFailures: config.maxConsecutiveHealthCheckFailures,
          minRequestsForEvaluation: config.minRequestsForEvaluation
        },
        defaults: DEFAULT_THRESHOLDS,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/settings/thresholds
 * Updates global health thresholds
 */
async function updateThresholds(req, res, next) {
  try {
    const {
      maxErrorRatePercent,
      warningErrorRatePercent,
      maxP95LatencyMs,
      warningP95LatencyMs,
      maxAvgLatencyMs,
      maxConsecutiveHealthCheckFailures,
      minRequestsForEvaluation
    } = req.body;

    let config = await ThresholdConfig.findOne({ isGlobal: true });
    if (!config) {
      config = new ThresholdConfig({ isGlobal: true });
    }

    if (maxErrorRatePercent !== undefined) config.maxErrorRatePercent = maxErrorRatePercent;
    if (warningErrorRatePercent !== undefined) config.warningErrorRatePercent = warningErrorRatePercent;
    if (maxP95LatencyMs !== undefined) config.maxP95LatencyMs = maxP95LatencyMs;
    if (warningP95LatencyMs !== undefined) config.warningP95LatencyMs = warningP95LatencyMs;
    if (maxAvgLatencyMs !== undefined) config.maxAvgLatencyMs = maxAvgLatencyMs;
    if (maxConsecutiveHealthCheckFailures !== undefined) {
      config.maxConsecutiveHealthCheckFailures = maxConsecutiveHealthCheckFailures;
    }
    if (minRequestsForEvaluation !== undefined) {
      config.minRequestsForEvaluation = minRequestsForEvaluation;
    }

    await config.save();

    res.json({
      success: true,
      message: 'Health thresholds updated successfully',
      data: {
        maxErrorRatePercent: config.maxErrorRatePercent,
        warningErrorRatePercent: config.warningErrorRatePercent,
        maxP95LatencyMs: config.maxP95LatencyMs,
        warningP95LatencyMs: config.warningP95LatencyMs,
        maxAvgLatencyMs: config.maxAvgLatencyMs,
        maxConsecutiveHealthCheckFailures: config.maxConsecutiveHealthCheckFailures,
        minRequestsForEvaluation: config.minRequestsForEvaluation,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/settings/reset
 * Resets thresholds back to factory defaults
 */
async function resetThresholds(req, res, next) {
  try {
    let config = await ThresholdConfig.findOne({ isGlobal: true });
    if (!config) {
      config = new ThresholdConfig({ isGlobal: true });
    }

    Object.assign(config, DEFAULT_THRESHOLDS);
    await config.save();

    res.json({
      success: true,
      message: 'Thresholds reset to factory defaults',
      data: DEFAULT_THRESHOLDS
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateThresholds,
  resetThresholds
};
