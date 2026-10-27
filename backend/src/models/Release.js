const mongoose = require('mongoose');
const { DEFAULT_THRESHOLDS } = require('../config/thresholds');

const releaseSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      required: [true, 'Application name is required'],
      trim: true,
      index: true
    },
    version: {
      type: String,
      required: [true, 'Candidate version is required'],
      trim: true
    },
    previousStableVersion: {
      type: String,
      required: [true, 'Previous stable version is required'],
      trim: true
    },
    candidateVersion: {
      type: String,
      required: [true, 'Candidate version is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Running', 'Healthy', 'Degraded', 'Rolled Back', 'Completed', 'Cancelled'],
      default: 'Draft',
      index: true
    },
    scenario: {
      type: String,
      enum: [
        'healthy',
        'error_spike',
        'slow_api',
        'service_failure',
        'gradual_degradation',
        'recovery_after_rollback'
      ],
      default: 'healthy'
    },
    rolloutPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    currentStageIndex: {
      type: Number,
      default: 0
    },
    stages: {
      type: [Number],
      default: [5, 25, 50, 100]
    },
    isPaused: {
      type: Boolean,
      default: false
    },
    finalDecision: {
      type: String,
      enum: ['PENDING', 'PROMOTED', 'ROLLBACK_RECOMMENDED', 'ROLLED_BACK', 'CANCELLED'],
      default: 'PENDING'
    },
    latestHealthStatus: {
      type: String,
      enum: ['UNKNOWN', 'HEALTHY', 'WARNING', 'UNHEALTHY'],
      default: 'UNKNOWN'
    },
    failingRuleExplanation: {
      type: String,
      default: ''
    },
    thresholds: {
      maxErrorRatePercent: { type: Number, default: DEFAULT_THRESHOLDS.maxErrorRatePercent },
      warningErrorRatePercent: { type: Number, default: DEFAULT_THRESHOLDS.warningErrorRatePercent },
      maxP95LatencyMs: { type: Number, default: DEFAULT_THRESHOLDS.maxP95LatencyMs },
      warningP95LatencyMs: { type: Number, default: DEFAULT_THRESHOLDS.warningP95LatencyMs },
      maxAvgLatencyMs: { type: Number, default: DEFAULT_THRESHOLDS.maxAvgLatencyMs },
      maxConsecutiveHealthCheckFailures: { type: Number, default: DEFAULT_THRESHOLDS.maxConsecutiveHealthCheckFailures },
      minRequestsForEvaluation: { type: Number, default: DEFAULT_THRESHOLDS.minRequestsForEvaluation }
    },
    latestMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    postRollbackRecoveryMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Helpful index for sorting and filtering
releaseSchema.index({ appName: 1, createdAt: -1 });

module.exports = mongoose.model('Release', releaseSchema);
