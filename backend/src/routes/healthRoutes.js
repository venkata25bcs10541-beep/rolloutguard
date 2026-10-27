const express = require('express');
const router = express.Router();
const { getSystemHealth } = require('../controllers/healthController');

router.get('/', getSystemHealth);

module.exports = router;
