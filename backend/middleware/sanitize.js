const xss = require('xss');
const { validationResult } = require('express-validator');

/**
 * Recursive function to strip XSS from string values within an object.
 * This directly prevents OWASP A03:2021-Injection by neutralizing malicious scripts.
 */
const sanitizeObject = (obj) => {
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = xss(obj[key]); // Filter HTML/JS tags
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]); // Recursive sanitization for nested objects
        }
    }
};

/**
 * Middleware: sanitizeBody
 * Intercepts the request body and strips out potential XSS payloads.
 */
const sanitizeBody = (req, res, next) => {
    if (req.body) {
        sanitizeObject(req.body);
    }
    next();
};

/**
 * Helper Middleware: validateRequest
 * Checks for validation errors gathered by express-validator chains.
 * If errors exist, returns a 400 Bad Request with the error details.
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    }
    next();
};

module.exports = {
    sanitizeBody,
    validateRequest
};
