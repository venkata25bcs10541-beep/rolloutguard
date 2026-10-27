require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    // Check if database needs initial seeding
    const Release = require('./models/Release');
    const count = await Release.countDocuments();
    if (count === 0) {
      console.log('[Server] Database is empty. Seeding initial demo releases and thresholds...');
      const { seedDatabase } = require('./utils/seed');
      // seedDatabase reconnects, but since we are already connected we can seed directly
      const ThresholdConfig = require('./models/ThresholdConfig');
      const { DEFAULT_THRESHOLDS } = require('./config/thresholds');
      await ThresholdConfig.create({ isGlobal: true, ...DEFAULT_THRESHOLDS });
      console.log('[Server] Default thresholds initialized.');
    }

    const server = http.createServer(app);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`🚀 RolloutGuard Server listening on port ${PORT}`);
      console.log(`   Host: 0.0.0.0`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health check: http://localhost:${PORT}/health (or /api/health)`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Gracefully terminating server...`);
      server.close(async () => {
        await disconnectDB();
        console.log('MongoDB disconnected. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('Failed to start RolloutGuard server:', error.message);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { startServer };
