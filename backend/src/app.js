const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security and utility middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, Postman, Supertest, server-to-server)
      if (!origin) return callback(null, true);
      // allow explicitly listed origins, any vercel preview deployment, or non-production requests
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Quick root health probe for hosting platforms (Render, Railway, etc.)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'RolloutGuard server is running' });
});

app.get('/', (req, res) => {
  res.status(200).json({
    service: 'RolloutGuard Deployment Safety API',
    status: 'online',
    healthCheck: '/health',
    apiHealth: '/api/health'
  });
});

// Body parsing with safe size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiter on API endpoints
app.use('/api', apiLimiter);

// Mount main API router
app.use('/api', routes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found`
  });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
