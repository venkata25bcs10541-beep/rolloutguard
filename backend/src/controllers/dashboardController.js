const Release = require('../models/Release');
const MetricSnapshot = require('../models/MetricSnapshot');
const ReleaseEvent = require('../models/ReleaseEvent');

/**
 * GET /api/dashboard
 * Aggregates statistics, recent activity, and trend data
 */
async function getDashboard(req, res, next) {
  try {
    const [
      totalReleases,
      healthyReleases,
      unhealthyReleases,
      rollbacksTriggered,
      recentReleases,
      recentEvents,
      activeRelease
    ] = await Promise.all([
      Release.countDocuments(),
      Release.countDocuments({ status: { $in: ['Healthy', 'Completed'] } }),
      Release.countDocuments({ status: 'Degraded' }),
      Release.countDocuments({ status: 'Rolled Back' }),
      Release.find().sort({ createdAt: -1 }).limit(6).lean(),
      ReleaseEvent.find().sort({ timestamp: -1 }).limit(10).lean(),
      Release.findOne({ status: { $in: ['Running', 'Healthy', 'Degraded', 'Draft'] } })
        .sort({ updatedAt: -1 })
        .lean()
    ]);

    // Build trend series from recent metric snapshots
    const recentSnapshots = await MetricSnapshot.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    // Map snapshots chronologically for trend charts
    const metricTrends = recentSnapshots.reverse().map((snap, idx) => ({
      index: idx + 1,
      timestamp: snap.timestamp,
      stage: snap.stage,
      rolloutPercentage: snap.rolloutPercentage,
      baselineErrorRate: snap.baseline?.errorRate || 0,
      candidateErrorRate: snap.candidate?.errorRate || 0,
      baselineAvgLatency: snap.baseline?.avgResponseTimeMs || 0,
      candidateAvgLatency: snap.candidate?.avgResponseTimeMs || 0,
      baselineP95Latency: snap.baseline?.p95ResponseTimeMs || 0,
      candidateP95Latency: snap.candidate?.p95ResponseTimeMs || 0,
      status: snap.evaluation?.status || 'HEALTHY'
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalReleases,
          healthyReleases,
          unhealthyReleases,
          rollbacksTriggered,
          activeCount: totalReleases - (healthyReleases + unhealthyReleases + rollbacksTriggered)
        },
        recentReleases,
        recentEvents,
        activeRelease,
        metricTrends,
        isEmpty: totalReleases === 0
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard
};
