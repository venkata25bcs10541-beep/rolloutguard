const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/releaseController');
const { validateCreateRelease } = require('../validators/releaseValidator');

router.get('/', getReleases);
router.post('/', validateCreateRelease, createRelease);
router.get('/:id', getReleaseById);
router.post('/:id/start', startRelease);
router.post('/:id/pause', pauseRelease);
router.post('/:id/resume', resumeRelease);
router.post('/:id/cancel', cancelRelease);
router.post('/:id/rollback', rollbackRelease);
router.get('/:id/events', getReleaseEvents);
router.get('/:id/metrics', getReleaseMetrics);

module.exports = router;
