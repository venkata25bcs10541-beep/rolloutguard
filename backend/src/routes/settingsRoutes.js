const express = require('express');
const router = express.Router();
const { getSettings, updateThresholds, resetThresholds } = require('../controllers/settingsController');
const { validateThresholds } = require('../validators/settingsValidator');

router.get('/', getSettings);
router.put('/thresholds', validateThresholds, updateThresholds);
router.post('/reset', resetThresholds);

module.exports = router;
