const app = require('../src/app');
const { connectDB } = require('../src/config/db');

/**
 * Serverless entry handler for Vercel deployment of the backend.
 * Automatically ensures MongoDB Atlas is connected before servicing requests.
 */
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    console.error('[Serverless] MongoDB connection failed:', error.message);
  }
  return app(req, res);
};
