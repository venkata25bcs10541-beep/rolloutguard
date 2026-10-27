const Release = require('../models/Release');
const MetricSnapshot = require('../models/MetricSnapshot');
const ReleaseEvent = require('../models/ReleaseEvent');
const ThresholdConfig = require('../models/ThresholdConfig');
const { DEFAULT_THRESHOLDS } = require('../config/thresholds');
const { generateScenarioMetrics, generateRollbackRecoveryMetrics } = require('./simulationEngine');
const { assertValidTransition } = require('../utils/stateTransitions');

/**
 * Fetch effective thresholds (configured global thresholds or system defaults)
 */
async function getEffectiveThresholds(appName = null) {
  let config = null;
  if (appName) {
    config = await ThresholdConfig.findOne({ appName });
  }
  if (!config) {
    config = await ThresholdConfig.findOne({ isGlobal: true });
  }
  if (!config) {
    return { ...DEFAULT_THRESHOLDS };
  }
  return {
    maxErrorRatePercent: config.maxErrorRatePercent,
    warningErrorRatePercent: config.warningErrorRatePercent,
    maxP95LatencyMs: config.maxP95LatencyMs,
    warningP95LatencyMs: config.warningP95LatencyMs,
    maxAvgLatencyMs: config.maxAvgLatencyMs,
    maxConsecutiveHealthCheckFailures: config.maxConsecutiveHealthCheckFailures,
    minRequestsForEvaluation: config.minRequestsForEvaluation
  };
}

/**
 * Create a new release
 */
async function createRelease(data) {
  const {
    appName,
    version,
    previousStableVersion,
    candidateVersion = version,
    scenario = 'healthy',
    description = ''
  } = data;

  const thresholds = await getEffectiveThresholds(appName);

  const release = await Release.create({
    appName,
    version,
    previousStableVersion,
    candidateVersion,
    scenario,
    status: 'Draft',
    rolloutPercentage: 0,
    currentStageIndex: 0,
    stages: [5, 25, 50, 100],
    finalDecision: 'PENDING',
    latestHealthStatus: 'UNKNOWN',
    thresholds,
    description
  });

  // Record creation timeline event
  await ReleaseEvent.create({
    releaseId: release._id,
    eventType: 'RELEASE_CREATED',
    title: 'Release Created',
    message: `Release ${candidateVersion} for ${appName} created in Draft state with '${scenario}' scenario.`,
    severity: 'info',
    rolloutPercentage: 0,
    metadata: { previousStableVersion, candidateVersion, scenario }
  });

  return release;
}

/**
 * Advance release to next rollout stage or run the current stage
 */
async function advanceRolloutStage(release) {
  const stages = release.stages && release.stages.length ? release.stages : [5, 25, 50, 100];
  const nextStageIndex = release.rolloutPercentage === 0 ? 0 : release.currentStageIndex + 1;

  if (nextStageIndex >= stages.length) {
    // All stages complete!
    assertValidTransition(release.status, 'Completed');
    release.status = 'Completed';
    release.rolloutPercentage = 100;
    release.finalDecision = 'PROMOTED';
    await release.save();

    await ReleaseEvent.create({
      releaseId: release._id,
      eventType: 'RELEASE_COMPLETED',
      title: 'Rollout Completed',
      message: `Candidate ${release.candidateVersion} reached 100% rollout safely with healthy metrics and has been promoted to stable.`,
      severity: 'success',
      rolloutPercentage: 100
    });

    return { release, halted: false };
  }

  const targetPercentage = stages[nextStageIndex];
  release.currentStageIndex = nextStageIndex;
  release.rolloutPercentage = targetPercentage;
  release.isPaused = false;

  // Generate scenario metrics for this stage
  const snapshotData = generateScenarioMetrics(
    release.scenario,
    targetPercentage,
    release.previousStableVersion,
    release.candidateVersion,
    release.thresholds
  );

  // Persist snapshot to MongoDB
  const metricSnapshot = await MetricSnapshot.create({
    releaseId: release._id,
    ...snapshotData
  });

  release.latestMetrics = snapshotData;
  release.latestHealthStatus = snapshotData.evaluation.status;

  // Record stage advance event
  await ReleaseEvent.create({
    releaseId: release._id,
    eventType: 'STAGE_ADVANCED',
    title: `Traffic Advanced to ${targetPercentage}%`,
    message: `Routed ${targetPercentage}% candidate traffic to ${release.candidateVersion}. Evaluated candidate metrics.`,
    severity: 'info',
    rolloutPercentage: targetPercentage,
    metadata: {
      errorRate: snapshotData.candidate.errorRate,
      p95ResponseTimeMs: snapshotData.candidate.p95ResponseTimeMs,
      healthCheckStatus: snapshotData.candidate.healthCheckStatus
    }
  });

  // Evaluate health outcome
  if (snapshotData.evaluation.status === 'UNHEALTHY') {
    // Release breached critical thresholds - STOP rollout immediately!
    assertValidTransition(release.status, 'Degraded');
    release.status = 'Degraded';
    release.finalDecision = 'ROLLBACK_RECOMMENDED';
    release.failingRuleExplanation = snapshotData.evaluation.summary;

    await ReleaseEvent.create({
      releaseId: release._id,
      eventType: 'THRESHOLD_BREACHED',
      title: 'Health Threshold Breached',
      message: snapshotData.evaluation.summary,
      severity: 'critical',
      rolloutPercentage: targetPercentage,
      metadata: { failedRules: snapshotData.evaluation.failedRules }
    });

    await ReleaseEvent.create({
      releaseId: release._id,
      eventType: 'ROLLBACK_RECOMMENDED',
      title: 'Rollback Recommended',
      message: `RolloutGuard halted progressive rollout at ${targetPercentage}%. Recommended immediate rollback to stable ${release.previousStableVersion}.`,
      severity: 'critical',
      rolloutPercentage: targetPercentage,
      metadata: { failedRules: snapshotData.evaluation.failedRules }
    });

    await release.save();
    return { release, snapshot: metricSnapshot, halted: true };
  } else if (snapshotData.evaluation.status === 'WARNING') {
    assertValidTransition(release.status, 'Healthy');
    release.status = 'Healthy';
    release.finalDecision = 'PENDING';
    release.failingRuleExplanation = snapshotData.evaluation.summary;

    await ReleaseEvent.create({
      releaseId: release._id,
      eventType: 'STAGE_ADVANCED',
      title: 'Health Check Warning',
      message: snapshotData.evaluation.summary,
      severity: 'warning',
      rolloutPercentage: targetPercentage,
      metadata: { failedRules: snapshotData.evaluation.failedRules }
    });

    await release.save();
    return { release, snapshot: metricSnapshot, halted: false };
  } else {
    // Fully healthy
    if (targetPercentage === 100) {
      assertValidTransition(release.status, 'Completed');
      release.status = 'Completed';
      release.finalDecision = 'PROMOTED';
    } else {
      assertValidTransition(release.status, 'Healthy');
      release.status = 'Healthy';
      release.finalDecision = 'PENDING';
    }
    release.failingRuleExplanation = '';

    await ReleaseEvent.create({
      releaseId: release._id,
      eventType: 'HEALTH_CHECK_PASSED',
      title: 'Health Checks Passed',
      message: `All metrics for stage ${targetPercentage}% remained within healthy limits (Error rate: ${snapshotData.candidate.errorRate}%, p95: ${snapshotData.candidate.p95ResponseTimeMs}ms).`,
      severity: 'success',
      rolloutPercentage: targetPercentage
    });

    if (release.status === 'Completed') {
      await ReleaseEvent.create({
        releaseId: release._id,
        eventType: 'RELEASE_COMPLETED',
        title: 'Release Completed Successfully',
        message: `Candidate ${release.candidateVersion} completed 100% rollout with zero health violations and is now active stable version.`,
        severity: 'success',
        rolloutPercentage: 100
      });
    }

    await release.save();
    return { release, snapshot: metricSnapshot, halted: false };
  }
}

/**
 * Start or advance a release rollout
 */
async function startRelease(id) {
  const release = await Release.findById(id);
  if (!release) {
    const error = new Error('Release not found');
    error.statusCode = 404;
    throw error;
  }

  if (release.status === 'Completed' || release.status === 'Rolled Back' || release.status === 'Cancelled') {
    const error = new Error(`Cannot start release in terminal state '${release.status}'`);
    error.statusCode = 400;
    throw error;
  }

  if (release.status === 'Draft') {
    assertValidTransition('Draft', 'Running');
    release.status = 'Running';
    await release.save();

    await ReleaseEvent.create({
      releaseId: release._id,
      eventType: 'ROLLOUT_STARTED',
      title: 'Progressive Rollout Started',
      message: `Automated progressive deployment initiated for ${release.appName} (${release.candidateVersion}).`,
      severity: 'info',
      rolloutPercentage: 0
    });
  }

  return advanceRolloutStage(release);
}

/**
 * Pause a running release
 */
async function pauseRelease(id) {
  const release = await Release.findById(id);
  if (!release) {
    const error = new Error('Release not found');
    error.statusCode = 404;
    throw error;
  }

  if (release.status === 'Completed' || release.status === 'Rolled Back' || release.status === 'Cancelled') {
    const error = new Error(`Cannot pause release in '${release.status}' status`);
    error.statusCode = 400;
    throw error;
  }

  release.isPaused = true;
  await release.save();

  await ReleaseEvent.create({
    releaseId: release._id,
    eventType: 'ROLLOUT_PAUSED',
    title: 'Rollout Paused',
    message: `Operator paused rollout at ${release.rolloutPercentage}%. Traffic allocation frozen.`,
    severity: 'warning',
    rolloutPercentage: release.rolloutPercentage
  });

  return release;
}

/**
 * Resume a paused release
 */
async function resumeRelease(id) {
  const release = await Release.findById(id);
  if (!release) {
    const error = new Error('Release not found');
    error.statusCode = 404;
    throw error;
  }

  if (!release.isPaused && release.status !== 'Degraded') {
    const error = new Error('Release is not currently paused or awaiting operator action');
    error.statusCode = 400;
    throw error;
  }

  release.isPaused = false;
  if (release.status === 'Degraded') {
    release.status = 'Running';
  }
  await release.save();

  await ReleaseEvent.create({
    releaseId: release._id,
    eventType: 'ROLLOUT_RESUMED',
    title: 'Rollout Resumed',
    message: `Operator resumed progressive rollout at ${release.rolloutPercentage}%.`,
    severity: 'info',
    rolloutPercentage: release.rolloutPercentage
  });

  return advanceRolloutStage(release);
}

/**
 * Cancel a release
 */
async function cancelRelease(id, reason = 'Operator cancelled rollout') {
  const release = await Release.findById(id);
  if (!release) {
    const error = new Error('Release not found');
    error.statusCode = 404;
    throw error;
  }

  assertValidTransition(release.status, 'Cancelled');
  release.status = 'Cancelled';
  release.finalDecision = 'CANCELLED';
  release.isPaused = false;
  await release.save();

  await ReleaseEvent.create({
    releaseId: release._id,
    eventType: 'RELEASE_CANCELLED',
    title: 'Release Cancelled',
    message: reason,
    severity: 'warning',
    rolloutPercentage: release.rolloutPercentage
  });

  return release;
}

/**
 * Execute rollback for a release
 */
async function rollbackRelease(id, reason = 'Automated rollback triggered') {
  const release = await Release.findById(id);
  if (!release) {
    const error = new Error('Release not found');
    error.statusCode = 404;
    throw error;
  }

  if (release.status === 'Rolled Back') {
    const error = new Error('Release has already been rolled back');
    error.statusCode = 400;
    throw error;
  }

  assertValidTransition(release.status, 'Rolled Back');

  // Generate simulated recovery metrics after reverting traffic back to previous stable version
  const recoveryMetrics = generateRollbackRecoveryMetrics(
    release.previousStableVersion,
    release.candidateVersion
  );

  const snapshot = await MetricSnapshot.create({
    releaseId: release._id,
    ...recoveryMetrics
  });

  release.status = 'Rolled Back';
  release.rolloutPercentage = 0;
  release.finalDecision = 'ROLLED_BACK';
  release.isPaused = false;
  release.latestHealthStatus = 'HEALTHY'; // Reverted back to healthy baseline
  release.postRollbackRecoveryMetrics = recoveryMetrics;
  await release.save();

  await ReleaseEvent.create({
    releaseId: release._id,
    eventType: 'ROLLBACK_EXECUTED',
    title: 'Rollback Executed',
    message: `Simulated traffic rerouted 100% to previous stable version (${release.previousStableVersion}). Candidate traffic cut to 0%. ${reason}`,
    severity: 'critical',
    rolloutPercentage: 0,
    metadata: {
      restoredVersion: release.previousStableVersion,
      recoveryMetrics: recoveryMetrics.baseline
    }
  });

  return { release, recoveryMetrics: snapshot };
}

module.exports = {
  createRelease,
  startRelease,
  pauseRelease,
  resumeRelease,
  cancelRelease,
  rollbackRelease,
  advanceRolloutStage,
  getEffectiveThresholds
};
