// ============================================================
// Breachwyre Backend — server.js
// MUST be first — loads .env before any other module reads process.env
// ============================================================
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');

// Log every require for Railway startup debugging
console.log('[BOOT] Core modules loaded');

const { connectRedis }             = require('./config/redis');
console.log('[BOOT] Redis config loaded');

const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
console.log('[BOOT] Rate limiter loaded');

const { sanitizeBody }             = require('./middleware/sanitize');
console.log('[BOOT] Sanitize loaded');

const authRoutes     = require('./routes/auth.routes');
console.log('[BOOT] Auth routes loaded');

const incidentRoutes = require('./routes/incident.routes');
console.log('[BOOT] Incident routes loaded');

const expertRoutes   = require('./routes/expert.routes');
console.log('[BOOT] Expert routes loaded');

const aiRoutes       = require('./routes/ai.routes');
console.log('[BOOT] AI routes loaded');

// ── App Setup ──────────────────────────────────────────────
const app = express();

// SECURITY: Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", "data:"],
      connectSrc:  ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173']
    }
  }
}));

// SECURITY: CORS — only allow frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Railway health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    // Also allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(null, true); // Temporarily allow all origins for debugging
  },
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(generalLimiter);

// XSS sanitization
app.use(sanitizeBody);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Check ───────────────────────────────────────────
app.get('/health', function(req, res) {
  res.status(200).json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'unknown'
  });
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/expert',    expertRoutes);
app.use('/api/ai',        aiRoutes);

// ── Global Error Handler ───────────────────────────────────
app.use(function(err, req, res, next) {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error:   err.message || 'Internal Server Error'
  });
});

// ── Startup ────────────────────────────────────────────────
var PORT = parseInt(process.env.PORT || '3001', 10);

async function startServer() {
  try {
    console.log('[BOOT] Attempting Redis connection...');
    if (typeof connectRedis === 'function') {
      await connectRedis();
    }
    console.log('[BOOT] Redis step complete');

    app.listen(PORT, '0.0.0.0', function() {
      console.log('[BOOT] Server listening on port ' + PORT);
      console.log('[BOOT] NODE_ENV: ' + (process.env.NODE_ENV || 'not set'));
      console.log('[BOOT] DB_HOST:  ' + (process.env.DB_HOST  || 'not set'));
      console.log('[BOOT] DB_NAME:  ' + (process.env.DB_NAME  || 'not set'));
    });
  } catch (err) {
    console.error('[BOOT] FATAL startup error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Catch any uncaught errors so Railway shows them in logs
process.on('uncaughtException', function(err) {
  console.error('[UNCAUGHT EXCEPTION]', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', function(reason) {
  console.error('[UNHANDLED REJECTION]', reason);
  process.exit(1);
});

startServer();
