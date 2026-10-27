require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Application = require('../models/Application');
const Release = require('../models/Release');
const MetricSnapshot = require('../models/MetricSnapshot');
const ReleaseEvent = require('../models/ReleaseEvent');
const ThresholdConfig = require('../models/ThresholdConfig');
const { DEFAULT_THRESHOLDS } = require('../config/thresholds');
const { generateScenarioMetrics, generateRollbackRecoveryMetrics } = require('../services/simulationEngine');

async function seedDatabase() {
  console.log('[Seed] Starting database seeding...');
  await connectDB();

  // Clear existing collections
  await Promise.all([
    Application.deleteMany({}),
    Release.deleteMany({}),
    MetricSnapshot.deleteMany({}),
    ReleaseEvent.deleteMany({}),
    ThresholdConfig.deleteMany({})
  ]);
  console.log('[Seed] Cleared existing data.');

  // 1. Seed Threshold Config
  const globalThresholds = await ThresholdConfig.create({
    isGlobal: true,
    ...DEFAULT_THRESHOLDS
  });
  console.log('[Seed] Seeded default threshold configuration.');

  // 2. Seed Applications
  const apps = await Application.insertMany([
    {
      name: 'checkout-service',
      displayName: 'Checkout & Cart Service',
      description: 'Core order calculation, cart validation and payment preparation service.',
      currentStableVersion: 'v2.4.0',
      environment: 'production'
    },
    {
      name: 'auth-gateway',
      displayName: 'Authentication & SSO Gateway',
      description: 'Handles token issue, OAuth2 callbacks, and session revoking.',
      currentStableVersion: 'v1.8.2',
      environment: 'production'
    },
    {
      name: 'notification-worker',
      displayName: 'Notification Dispatcher',
      description: 'Async queues for emails, SMS, and push notifications.',
      currentStableVersion: 'v3.1.0',
      environment: 'production'
    }
  ]);
  console.log(`[Seed] Seeded ${apps.length} applications.`);

  // 3. Seed Release 1: Successfully Completed Healthy Release
  const release1 = await Release.create({
    appName: 'checkout-service',
    version: 'v2.4.0',
    previousStableVersion: 'v2.3.9',
    candidateVersion: 'v2.4.0',
    status: 'Completed',
    scenario: 'healthy',
    rolloutPercentage: 100,
    currentStageIndex: 3,
    stages: [5, 25, 50, 100],
    finalDecision: 'PROMOTED',
    latestHealthStatus: 'HEALTHY',
    thresholds: DEFAULT_THRESHOLDS,
    description: 'Optimized database indexing for checkout queries and cache warmups.'
  });

  // Events & Snapshots for Release 1
  for (const pct of [5, 25, 50, 100]) {
    const snapData = generateScenarioMetrics('healthy', pct, 'v2.3.9', 'v2.4.0', DEFAULT_THRESHOLDS);
    const snap = await MetricSnapshot.create({
      releaseId: release1._id,
      ...snapData
    });

    await ReleaseEvent.create({
      releaseId: release1._id,
      eventType: pct === 5 ? 'ROLLOUT_STARTED' : pct === 100 ? 'RELEASE_COMPLETED' : 'STAGE_ADVANCED',
      title: pct === 100 ? 'Release Completed' : `Stage ${pct}% Verified`,
      message: pct === 100 ? 'Candidate v2.4.0 reached 100% rollout safely with healthy metrics and promoted to stable.' : `Traffic advanced to ${pct}%. Candidate metrics healthy.`,
      severity: 'success',
      rolloutPercentage: pct
    });

    if (pct === 100) {
      release1.latestMetrics = snapData;
      await release1.save();
    }
  }

  // 4. Seed Release 2: Error Spike Detected & Rolled Back
  const release2 = await Release.create({
    appName: 'auth-gateway',
    version: 'v1.9.0',
    previousStableVersion: 'v1.8.2',
    candidateVersion: 'v1.9.0',
    status: 'Rolled Back',
    scenario: 'error_spike',
    rolloutPercentage: 0,
    currentStageIndex: 1,
    stages: [5, 25, 50, 100],
    finalDecision: 'ROLLED_BACK',
    latestHealthStatus: 'HEALTHY',
    thresholds: DEFAULT_THRESHOLDS,
    failingRuleExplanation: 'Release is unhealthy: Candidate error rate of 18.5% exceeds the critical threshold of 5%.',
    description: 'Updated JWT validation library. Caused signature parsing failures.'
  });

  // Stage 5% passed
  const snap2_5 = generateScenarioMetrics('healthy', 5, 'v1.8.2', 'v1.9.0', DEFAULT_THRESHOLDS);
  await MetricSnapshot.create({ releaseId: release2._id, ...snap2_5 });
  await ReleaseEvent.create({
    releaseId: release2._id,
    eventType: 'STAGE_ADVANCED',
    title: 'Stage 5% Passed',
    message: 'Candidate v1.9.0 healthy at 5% canary traffic.',
    severity: 'info',
    rolloutPercentage: 5
  });

  // Stage 25% spiked
  const snap2_25 = generateScenarioMetrics('error_spike', 25, 'v1.8.2', 'v1.9.0', DEFAULT_THRESHOLDS);
  await MetricSnapshot.create({ releaseId: release2._id, ...snap2_25 });
  await ReleaseEvent.create({
    releaseId: release2._id,
    eventType: 'THRESHOLD_BREACHED',
    title: 'Health Threshold Breached',
    message: 'Candidate error rate of 18.5% exceeds critical threshold of 5%.',
    severity: 'critical',
    rolloutPercentage: 25
  });
  await ReleaseEvent.create({
    releaseId: release2._id,
    eventType: 'ROLLBACK_RECOMMENDED',
    title: 'Rollback Recommended',
    message: 'Rollout halted at 25%. Recommended rollback to v1.8.2.',
    severity: 'critical',
    rolloutPercentage: 25
  });

  // Rollback executed
  const recovery2 = generateRollbackRecoveryMetrics('v1.8.2', 'v1.9.0');
  await MetricSnapshot.create({ releaseId: release2._id, ...recovery2 });
  release2.latestMetrics = snap2_25;
  release2.postRollbackRecoveryMetrics = recovery2;
  await release2.save();

  await ReleaseEvent.create({
    releaseId: release2._id,
    eventType: 'ROLLBACK_EXECUTED',
    title: 'Rollback Executed',
    message: 'Simulated traffic reverted 100% to stable baseline v1.8.2. Error rates normalized to 0.8%.',
    severity: 'critical',
    rolloutPercentage: 0
  });

  // 5. Seed Release 3: Active Degraded Release (Slow API scenario halted at 50%)
  const release3 = await Release.create({
    appName: 'notification-worker',
    version: 'v3.2.0',
    previousStableVersion: 'v3.1.0',
    candidateVersion: 'v3.2.0',
    status: 'Degraded',
    scenario: 'slow_api',
    rolloutPercentage: 50,
    currentStageIndex: 2,
    stages: [5, 25, 50, 100],
    finalDecision: 'ROLLBACK_RECOMMENDED',
    latestHealthStatus: 'UNHEALTHY',
    thresholds: DEFAULT_THRESHOLDS,
    failingRuleExplanation: 'Release is unhealthy: p95 response time of 1580ms exceeds the critical ceiling of 1000ms.',
    description: 'Refactored template rendering engine. High latency under concurrency.'
  });

  const snap3_50 = generateScenarioMetrics('slow_api', 50, 'v3.1.0', 'v3.2.0', DEFAULT_THRESHOLDS);
  await MetricSnapshot.create({ releaseId: release3._id, ...snap3_50 });
  release3.latestMetrics = snap3_50;
  await release3.save();

  await ReleaseEvent.create({
    releaseId: release3._id,
    eventType: 'THRESHOLD_BREACHED',
    title: 'High Latency Detected',
    message: 'p95 response time reached 1,580ms (limit 1,000ms). Progressive rollout halted.',
    severity: 'critical',
    rolloutPercentage: 50
  });

  // 6. Seed Release 4: Draft Release ready for user simulation
  const release4 = await Release.create({
    appName: 'checkout-service',
    version: 'v2.5.0-rc1',
    previousStableVersion: 'v2.4.0',
    candidateVersion: 'v2.5.0-rc1',
    status: 'Draft',
    scenario: 'healthy',
    rolloutPercentage: 0,
    currentStageIndex: 0,
    stages: [5, 25, 50, 100],
    finalDecision: 'PENDING',
    latestHealthStatus: 'UNKNOWN',
    thresholds: DEFAULT_THRESHOLDS,
    description: 'New Apple Pay and Google Pay one-click checkout integration.'
  });
  await ReleaseEvent.create({
    releaseId: release4._id,
    eventType: 'RELEASE_CREATED',
    title: 'Release Created',
    message: 'Release v2.5.0-rc1 created in Draft state ready for deployment simulation.',
    severity: 'info',
    rolloutPercentage: 0
  });

  console.log('[Seed] Database successfully seeded with 4 realistic releases and full metric histories!');
  await disconnectDB();
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
