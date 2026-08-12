const rateLimit = require('express-rate-limit');

/**
 * General Rate Limiter
 * Applied to most API routes to prevent general DoS/DDoS attacks.
 * Configured for 100 requests per 15 minutes per IP address.
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        error: 'Too many requests',
        message: 'You have exceeded your request limit. Please try again after 15 minutes.'
    }
});

/**
 * Authentication Rate Limiter
 * Applied specifically to login and registration routes to prevent brute-force and credential stuffing attacks.
 * Configured strictly for 5 requests per 15 minutes per IP address.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many authentication attempts',
        message: 'Too many login attempts from this IP. Please try again after 15 minutes for security purposes.'
    }
});

module.exports = {
    generalLimiter,
    authLimiter
};
