const mongoose = require('mongoose');
const { getDBStatus } = require('../config/db');

/**
 * GET /api/health
 * Returns service and database status
 */
function getSystemHealth(req, res) {
  const dbStatus = getDBStatus();
  const mongooseState = mongoose.connection.readyState;
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isDbHealthy = mongooseState === 1;

  const healthData = {
    service: 'RolloutGuard API',
    status: isDbHealthy ? 'HEALTHY' : 'UNHEALTHY',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      connected: isDbHealthy,
      readyState: mongooseState,
      isInMemory: dbStatus.isInMemory,
      databaseName: dbStatus.dbName || mongoose.connection.name || 'unknown',
      error: dbStatus.error
    },
    simulationMode: 'Simulated Traffic & Release Engine active'
  };

  const statusCode = isDbHealthy ? 200 : 503;
  return res.status(statusCode).json(healthData);
}

module.exports = {
  getSystemHealth
};
