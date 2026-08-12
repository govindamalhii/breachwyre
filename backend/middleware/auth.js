const jwt = require('jsonwebtoken');

/**
 * Middleware: authenticate
 * Validates the JWT token from the Authorization header using the Bearer scheme.
 * If valid, decodes the token and attaches the payload to req.user.
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication failed',
            message: 'Missing or malformed Authorization header.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token with secret from environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');
        
        // Attach decoded payload (e.g., user id and role) to request object
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid or expired token.'
        });
    }
};

/**
 * Factory Middleware: requireRole
 * Implements Role-Based Access Control (RBAC).
 * Expects authenticate middleware to be called prior.
 * @param {...string} allowedRoles - List of roles permitted to access the route.
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Ensure req.user exists (authenticate middleware must run first)
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                error: 'Authorization failed',
                message: 'User identity not found in request.'
            });
        }

        // Check if user's role is in the list of allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have the required permissions to perform this action.'
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    requireRole
};
