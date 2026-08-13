// MUST be first — loads .env before any other module reads process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { connectRedis } = require('./config/redis');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const sanitizeBody = require('./middleware/sanitize');

// Import routes
const authRoutes     = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const expertRoutes   = require('./routes/expert.routes');
const aiRoutes       = require('./routes/ai.routes');


const app = express();

// SECURITY: Helmet for various HTTP headers, including CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173']
    }
  }
}));

// SECURITY: CORS setup
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SECURITY: Apply general rate limiter
app.use(generalLimiter);

// SECURITY: Sanitize body payloads (XSS protection)
app.use(sanitizeBody);

// Serve static files from uploads folder (with caution in prod)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
// Apply stricter rate limit on auth
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Attempt connecting to Redis for rate limiting/caching if configured
    if (typeof connectRedis === 'function') {
      await connectRedis();
    }

    app.listen(PORT, () => {
      console.log(\`Server listening on port \${PORT}\`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
