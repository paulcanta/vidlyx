const authService = require('../services/authService');

/**
 * Middleware to require authentication
 * Checks if user is logged in and attaches user to req.user
 */
async function requireAuth(req, res, next) {
  try {
    // Check if session exists
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fetch user data
    const user = await authService.findUserById(req.session.userId);

    if (!user) {
      // Session exists but user not found - clear session
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require admin role
 * Must be used after requireAuth
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
