const mongoose = require('mongoose');
const { DEFAULT_THRESHOLDS } = require('../config/thresholds');

const thresholdConfigSchema = new mongoose.Schema(
  {
    isGlobal: {
      type: Boolean,
      default: true,
      unique: true
    },
    appName: {
      type: String,
      default: null
    },
    maxErrorRatePercent: {
      type: Number,
      required: true,
      min: [0, 'Max error rate cannot be negative'],
      max: [100, 'Max error rate cannot exceed 100%'],
      default: DEFAULT_THRESHOLDS.maxErrorRatePercent
    },
    warningErrorRatePercent: {
      type: Number,
      required: true,
      min: [0, 'Warning error rate cannot be negative'],
      max: [100, 'Warning error rate cannot exceed 100%'],
      default: DEFAULT_THRESHOLDS.warningErrorRatePercent
    },
    maxP95LatencyMs: {
      type: Number,
      required: true,
      min: [1, 'Max p95 latency must be at least 1ms'],
      default: DEFAULT_THRESHOLDS.maxP95LatencyMs
    },
    warningP95LatencyMs: {
      type: Number,
      required: true,
      min: [1, 'Warning p95 latency must be at least 1ms'],
      default: DEFAULT_THRESHOLDS.warningP95LatencyMs
    },
    maxAvgLatencyMs: {
      type: Number,
      required: true,
      min: [1, 'Max avg latency must be at least 1ms'],
      default: DEFAULT_THRESHOLDS.maxAvgLatencyMs
    },
    maxConsecutiveHealthCheckFailures: {
      type: Number,
      required: true,
      min: [1, 'Max health check failures must be at least 1'],
      default: DEFAULT_THRESHOLDS.maxConsecutiveHealthCheckFailures
    },
    minRequestsForEvaluation: {
      type: Number,
      required: true,
      min: [1, 'Min requests for evaluation must be at least 1'],
      default: DEFAULT_THRESHOLDS.minRequestsForEvaluation
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ThresholdConfig', thresholdConfigSchema);
