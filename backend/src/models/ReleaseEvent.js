const mongoose = require('mongoose');

const releaseEventSchema = new mongoose.Schema(
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
    eventType: {
      type: String,
      required: true,
      enum: [
        'RELEASE_CREATED',
        'ROLLOUT_STARTED',
        'STAGE_ADVANCED',
        'HEALTH_CHECK_PASSED',
        'HEALTH_CHECK_FAILED',
        'THRESHOLD_BREACHED',
        'ROLLOUT_PAUSED',
        'ROLLOUT_RESUMED',
        'ROLLBACK_RECOMMENDED',
        'ROLLBACK_EXECUTED',
        'RELEASE_COMPLETED',
        'RELEASE_CANCELLED'
      ]
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical', 'success'],
      default: 'info'
    },
    rolloutPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ReleaseEvent', releaseEventSchema);
