const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Release = require('../src/models/Release');
const ReleaseEvent = require('../src/models/ReleaseEvent');
const MetricSnapshot = require('../src/models/MetricSnapshot');
const ThresholdConfig = require('../src/models/ThresholdConfig');
const { DEFAULT_THRESHOLDS } = require('../src/config/thresholds');
const { evaluateHealth } = require('../src/services/healthEvaluator');
const { generateScenarioMetrics } = require('../src/services/simulationEngine');

require('./setup');

describe('RolloutGuard Test Suite', () => {

  // Test 1: Creating a release with valid input succeeds
  test('1. Creating a release with valid input succeeds', async () => {
    const payload = {
      appName: 'payment-service',
      version: 'v2.1.0',
      previousStableVersion: 'v2.0.0',
      candidateVersion: 'v2.1.0',
      scenario: 'healthy',
      description: 'Zero downtime payment processor update'
    };

    const res = await request(app)
      .post('/api/releases')
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.appName).toBe('payment-service');
    expect(res.body.data.version).toBe('v2.1.0');
    expect(res.body.data.status).toBe('Draft');
    expect(res.body.data.rolloutPercentage).toBe(0);

    // Verify timeline creation event was stored in MongoDB
    const events = await ReleaseEvent.find({ releaseId: res.body.data._id });
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('RELEASE_CREATED');
  });

  // Test 2: Invalid release data is rejected
  test('2. Invalid release data is rejected', async () => {
    const invalidPayload = {
      appName: '', // empty appName
      previousStableVersion: ''
      // missing candidateVersion
    };

    const res = await request(app)
      .post('/api/releases')
      .send(invalidPayload)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  // Test 3: A healthy release completes successfully
  test('3. A healthy release completes successfully through all stages to 100%', async () => {
    // Create release with healthy scenario
    const createRes = await request(app)
      .post('/api/releases')
      .send({
        appName: 'order-api',
        version: 'v1.5.0',
        previousStableVersion: 'v1.4.0',
        candidateVersion: 'v1.5.0',
        scenario: 'healthy'
      })
      .expect(201);

    const releaseId = createRes.body.data._id;

    // Advance stages: 5% -> 25% -> 50% -> 100%
    const stages = [5, 25, 50, 100];
    for (let i = 0; i < stages.length; i++) {
      const stepRes = await request(app)
        .post(`/api/releases/${releaseId}/start`)
        .expect(200);

      expect(stepRes.body.success).toBe(true);
      expect(stepRes.body.halted).toBe(false);
      expect(stepRes.body.data.rolloutPercentage).toBe(stages[i]);
    }

    // Final check: Release should now be Completed and promoted
    const finalRes = await request(app)
      .get(`/api/releases/${releaseId}`)
      .expect(200);

    expect(finalRes.body.data.status).toBe('Completed');
    expect(finalRes.body.data.finalDecision).toBe('PROMOTED');
    expect(finalRes.body.data.rolloutPercentage).toBe(100);
  });

  // Test 4: An error-spike scenario is detected as unhealthy
  test('4. An error-spike scenario is detected as unhealthy', async () => {
    const metrics = generateScenarioMetrics('error_spike', 25, 'v1.0.0', 'v2.0.0', DEFAULT_THRESHOLDS);
    expect(metrics.candidate.errorRate).toBeGreaterThan(DEFAULT_THRESHOLDS.maxErrorRatePercent);

    const evaluation = evaluateHealth(metrics.candidate, DEFAULT_THRESHOLDS);
    expect(evaluation.status).toBe('UNHEALTHY');
    expect(evaluation.decision).toBe('ROLLBACK_RECOMMENDED');
    expect(evaluation.failedRules.some(r => r.rule === 'ERROR_RATE_EXCEEDED')).toBe(true);
  });

  // Test 5: A slow-API scenario triggers the relevant threshold
  test('5. A slow-API scenario triggers the relevant p95 latency threshold', async () => {
    const metrics = generateScenarioMetrics('slow_api', 25, 'v1.0.0', 'v2.0.0', DEFAULT_THRESHOLDS);
    expect(metrics.candidate.p95ResponseTimeMs).toBeGreaterThan(DEFAULT_THRESHOLDS.maxP95LatencyMs);

    const evaluation = evaluateHealth(metrics.candidate, DEFAULT_THRESHOLDS);
    expect(evaluation.status).toBe('UNHEALTHY');
    expect(evaluation.decision).toBe('ROLLBACK_RECOMMENDED');
    expect(evaluation.failedRules.some(r => r.rule === 'P95_LATENCY_EXCEEDED')).toBe(true);
  });

  // Test 6: An unhealthy staged rollout stops progressing
  test('6. An unhealthy staged rollout stops progressing', async () => {
    const createRes = await request(app)
      .post('/api/releases')
      .send({
        appName: 'billing-engine',
        version: 'v3.0.0',
        previousStableVersion: 'v2.9.0',
        candidateVersion: 'v3.0.0',
        scenario: 'error_spike'
      })
      .expect(201);

    const releaseId = createRes.body.data._id;

    // First advance to 5% with error_spike scenario
    const runRes = await request(app)
      .post(`/api/releases/${releaseId}/start`)
      .expect(200);

    expect(runRes.body.halted).toBe(true);
    expect(runRes.body.data.status).toBe('Degraded');
    expect(runRes.body.data.finalDecision).toBe('ROLLBACK_RECOMMENDED');

    // Attempting to start/advance further without resolving must not progress
    const checkRes = await request(app)
      .get(`/api/releases/${releaseId}`)
      .expect(200);

    expect(checkRes.body.data.status).toBe('Degraded');
    expect(checkRes.body.data.rolloutPercentage).toBe(5);
  });

  // Test 7: Rollback updates the simulated release state and records a timeline event
  test('7. Rollback updates the simulated release state and records a timeline event', async () => {
    const createRes = await request(app)
      .post('/api/releases')
      .send({
        appName: 'shipping-api',
        version: 'v2.0.0',
        previousStableVersion: 'v1.9.0',
        candidateVersion: 'v2.0.0',
        scenario: 'error_spike'
      })
      .expect(201);

    const releaseId = createRes.body.data._id;

    // Advance to trigger degradation
    await request(app).post(`/api/releases/${releaseId}/start`);

    // Execute rollback
    const rollbackRes = await request(app)
      .post(`/api/releases/${releaseId}/rollback`)
      .send({ reason: 'Critical error rate spike in canary stage' })
      .expect(200);

    expect(rollbackRes.body.success).toBe(true);
    expect(rollbackRes.body.data.status).toBe('Rolled Back');
    expect(rollbackRes.body.data.rolloutPercentage).toBe(0);
    expect(rollbackRes.body.data.finalDecision).toBe('ROLLED_BACK');
    expect(rollbackRes.body.data.postRollbackRecoveryMetrics).toBeDefined();

    // Verify timeline recorded the ROLLBACK_EXECUTED event
    const eventsRes = await request(app)
      .get(`/api/releases/${releaseId}/events`)
      .expect(200);

    const rollbackEvent = eventsRes.body.data.find(e => e.eventType === 'ROLLBACK_EXECUTED');
    expect(rollbackEvent).toBeDefined();
    expect(rollbackEvent.severity).toBe('critical');
  });

  // Test 8: A healthy release does not incorrectly trigger rollback
  test('8. A healthy release does not incorrectly trigger rollback', async () => {
    const metrics = generateScenarioMetrics('healthy', 50, 'v1.0.0', 'v1.1.0', DEFAULT_THRESHOLDS);
    const evaluation = evaluateHealth(metrics.candidate, DEFAULT_THRESHOLDS);

    expect(evaluation.status).toBe('HEALTHY');
    expect(evaluation.decision).toBe('PROCEED');
    expect(evaluation.failedRules.length).toBe(0);
  });

  // Test 9: Invalid state transitions are rejected
  test('9. Invalid state transitions are rejected', async () => {
    // Create release and advance to completion
    const createRes = await request(app)
      .post('/api/releases')
      .send({
        appName: 'catalog-service',
        version: 'v4.0.0',
        previousStableVersion: 'v3.9.0',
        candidateVersion: 'v4.0.0',
        scenario: 'healthy'
      })
      .expect(201);

    const releaseId = createRes.body.data._id;

    // Advance 4 times to complete
    for (let i = 0; i < 4; i++) {
      await request(app).post(`/api/releases/${releaseId}/start`);
    }

    const check = await Release.findById(releaseId);
    expect(check.status).toBe('Completed');

    // Attempting to rollback a Completed release or start it again should be rejected with 400
    const invalidStartRes = await request(app)
      .post(`/api/releases/${releaseId}/start`)
      .expect(400);

    expect(invalidStartRes.body.success).toBe(false);

    const invalidRollbackRes = await request(app)
      .post(`/api/releases/${releaseId}/rollback`)
      .expect(400);

    expect(invalidRollbackRes.body.success).toBe(false);
  });

  // Test 10: Missing releases return the correct error response
  test('10. Missing releases return the correct 404 error response', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/releases/${nonExistentId}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);

    // Invalid ObjectId format returns 400
    const invalidFormatRes = await request(app)
      .get('/api/releases/not-a-valid-object-id')
      .expect(400);

    expect(invalidFormatRes.body.success).toBe(false);
  });

  // Test 11: The dashboard aggregates stored data correctly
  test('11. The dashboard aggregates stored data correctly', async () => {
    // Empty dashboard
    const emptyRes = await request(app)
      .get('/api/dashboard')
      .expect(200);

    expect(emptyRes.body.data.summary.totalReleases).toBe(0);
    expect(emptyRes.body.data.isEmpty).toBe(true);

    // Create 1 completed release and 1 degraded release
    const r1 = await Release.create({
      appName: 'app-a',
      version: 'v1.0.0',
      previousStableVersion: 'v0.9.0',
      candidateVersion: 'v1.0.0',
      status: 'Completed',
      rolloutPercentage: 100
    });

    const r2 = await Release.create({
      appName: 'app-b',
      version: 'v2.0.0',
      previousStableVersion: 'v1.9.0',
      candidateVersion: 'v2.0.0',
      status: 'Degraded',
      rolloutPercentage: 25
    });

    const filledRes = await request(app)
      .get('/api/dashboard')
      .expect(200);

    expect(filledRes.body.data.summary.totalReleases).toBe(2);
    expect(filledRes.body.data.summary.healthyReleases).toBe(1);
    expect(filledRes.body.data.summary.unhealthyReleases).toBe(1);
    expect(filledRes.body.data.isEmpty).toBe(false);
  });

  // Test 12: Configured thresholds influence health evaluation
  test('12. Configured thresholds influence health evaluation', async () => {
    // With standard threshold (maxErrorRatePercent = 5.0%), an error rate of 3.5% is HEALTHY/WARNING
    const candidateMetrics = {
      version: 'v1.2.0',
      requestCount: 500,
      successfulRequests: 482,
      failedRequests: 18,
      errorRate: 3.6,
      avgResponseTimeMs: 120,
      p95ResponseTimeMs: 250,
      healthCheckStatus: 'PASSING',
      consecutiveHealthCheckFailures: 0
    };

    const standardEvaluation = evaluateHealth(candidateMetrics, { maxErrorRatePercent: 5.0 });
    expect(standardEvaluation.status).not.toBe('UNHEALTHY');

    // With a tighter custom threshold (maxErrorRatePercent = 2.0%), the exact same 3.6% error rate becomes UNHEALTHY
    const strictEvaluation = evaluateHealth(candidateMetrics, { maxErrorRatePercent: 2.0 });
    expect(strictEvaluation.status).toBe('UNHEALTHY');
    expect(strictEvaluation.decision).toBe('ROLLBACK_RECOMMENDED');
    expect(strictEvaluation.failedRules.some(r => r.rule === 'ERROR_RATE_EXCEEDED')).toBe(true);
  });

});
