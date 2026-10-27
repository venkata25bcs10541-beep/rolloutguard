const Release = require('../models/Release');
const MetricSnapshot = require('../models/MetricSnapshot');
const ReleaseEvent = require('../models/ReleaseEvent');
const releaseService = require('../services/releaseService');

/**
 * GET /api/releases
 * Query params: page, limit, status, appName, search
 */
async function getReleases(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.appName) {
      query.appName = req.query.appName;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { appName: searchRegex },
        { version: searchRegex },
        { candidateVersion: searchRegex }
      ];
    }

    const [releases, total] = await Promise.all([
      Release.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Release.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: releases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/releases/:id
 */
async function getReleaseById(req, res, next) {
  try {
    const release = await Release.findById(req.params.id);
    if (!release) {
      return res.status(404).json({
        success: false,
        message: 'Release not found'
      });
    }

    // Get latest metric snapshot and recent events
    const [latestSnapshot, events] = await Promise.all([
      MetricSnapshot.findOne({ releaseId: release._id }).sort({ createdAt: -1 }).lean(),
      ReleaseEvent.find({ releaseId: release._id }).sort({ timestamp: -1 }).limit(20).lean()
    ]);

    res.json({
      success: true,
      data: {
        ...release.toObject(),
        latestSnapshot,
        recentEvents: events
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/releases
 */
async function createRelease(req, res, next) {
  try {
    const release = await releaseService.createRelease(req.body);
    res.status(201).json({
      success: true,
      message: 'Release created successfully',
      data: release
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/releases/:id/start
 */
async function startRelease(req, res, next) {
  try {
    const result = await releaseService.startRelease(req.params.id);
    res.json({
      success: true,
      message: result.halted
        ? 'Rollout started but halted due to health threshold breach'
        : 'Rollout advanced successfully',
      data: result.release,
      snapshot: result.snapshot,
      halted: result.halted
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/releases/:id/pause
 */
async function pauseRelease(req, res, next) {
  try {
    const release = await releaseService.pauseRelease(req.params.id);
    res.json({
      success: true,
      message: 'Release paused',
      data: release
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/releases/:id/resume
 */
async function resumeRelease(req, res, next) {
  try {
    const result = await releaseService.resumeRelease(req.params.id);
    res.json({
      success: true,
      message: result.halted
        ? 'Rollout resumed but halted due to health threshold breach'
        : 'Rollout resumed and advanced',
      data: result.release,
      snapshot: result.snapshot,
      halted: result.halted
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/releases/:id/cancel
 */
async function cancelRelease(req, res, next) {
  try {
    const reason = req.body?.reason || 'Rollout cancelled by user';
    const release = await releaseService.cancelRelease(req.params.id, reason);
    res.json({
      success: true,
      message: 'Release cancelled',
      data: release
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/releases/:id/rollback
 */
async function rollbackRelease(req, res, next) {
  try {
    const reason = req.body?.reason || 'User initiated simulated rollback';
    const result = await releaseService.rollbackRelease(req.params.id, reason);
    res.json({
      success: true,
      message: 'Rollback executed successfully. Traffic restored to stable baseline.',
      data: result.release,
      recoveryMetrics: result.recoveryMetrics
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/releases/:id/events
 */
async function getReleaseEvents(req, res, next) {
  try {
    const release = await Release.findById(req.params.id);
    if (!release) {
      return res.status(404).json({
        success: false,
        message: 'Release not found'
      });
    }

    const events = await ReleaseEvent.find({ releaseId: release._id })
      .sort({ timestamp: -1 })
      .lean();

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/releases/:id/metrics
 */
async function getReleaseMetrics(req, res, next) {
  try {
    const release = await Release.findById(req.params.id);
    if (!release) {
      return res.status(404).json({
        success: false,
        message: 'Release not found'
      });
    }

    const snapshots = await MetricSnapshot.find({ releaseId: release._id })
      .sort({ timestamp: 1 })
      .lean();

    res.json({
      success: true,
      data: snapshots
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReleases,
  getReleaseById,
  createRelease,
  startRelease,
  pauseRelease,
  resumeRelease,
  cancelRelease,
  rollbackRelease,
  getReleaseEvents,
  getReleaseMetrics
};
