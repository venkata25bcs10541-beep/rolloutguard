const mongoose = require('mongoose');

const endpointMetricSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true
    },
    requestCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    successfulRequests: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    failedRequests: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    errorRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    },
    avgResponseTimeMs: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    p95ResponseTimeMs: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    healthCheckStatus: {
      type: String,
      enum: ['PASSING', 'FAILING'],
      default: 'PASSING'
    },
    healthCheckStatusCode: {
      type: Number,
      default: 200
    },
    consecutiveHealthCheckFailures: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const failedRuleSchema = new mongoose.Schema(
  {
    rule: { type: String, required: true },
    threshold: { type: mongoose.Schema.Types.Mixed, required: true },
    actual: { type: mongoose.Schema.Types.Mixed, required: true },
    severity: { type: String, enum: ['WARNING', 'CRITICAL'], default: 'CRITICAL' },
    message: { type: String, required: true }
  },
  { _id: false }
);

const metricSnapshotSchema = new mongoose.Schema(
  {
    releaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Release',
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    rolloutPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    stage: {
      type: String,
      required: true
    },
    isSimulated: {
      type: Boolean,
      default: true
    },
    baseline: {
      type: endpointMetricSchema,
      required: true
    },
    candidate: {
      type: endpointMetricSchema,
      required: true
    },
    evaluation: {
      status: {
        type: String,
        enum: ['HEALTHY', 'WARNING', 'UNHEALTHY', 'UNKNOWN'],
        default: 'HEALTHY'
      },
      decision: {
        type: String,
        enum: ['PROCEED', 'PAUSE_AND_INVESTIGATE', 'ROLLBACK_RECOMMENDED'],
        default: 'PROCEED'
      },
      failedRules: [failedRuleSchema],
      summary: { type: String, default: 'All health checks passed within thresholds' }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MetricSnapshot', metricSnapshotSchema);
