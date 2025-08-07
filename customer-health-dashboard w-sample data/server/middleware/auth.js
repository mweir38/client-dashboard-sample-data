const jwt = require('jsonwebtoken');

// Middleware for JWT authentication
const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle impersonation tokens (they have isImpersonation flag)
    if (decoded.isImpersonation) {
      req.user = decoded; // Use the entire decoded object for impersonation
    } else {
      req.user = decoded.user; // Use the user property for regular tokens
    }
    
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware for role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'Access denied' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access forbidden: insufficient permissions' });
    }

    next();
  };
};

module.exports = { auth, authorize };
