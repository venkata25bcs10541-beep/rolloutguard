const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const releaseRoutes = require('./releaseRoutes');
const settingsRoutes = require('./settingsRoutes');

router.use('/health', healthRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/releases', releaseRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
