// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Pulls JWT from:
 * 1) Authorization: Bearer <token>
 * 2) req.cookies.token (optional, if you set cookies)
 */
export function isAuthenticated(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const cookieToken = req.cookies?.token;
    const token = bearer || cookieToken;

    if (!token) {
      return res.status(401).json({ error: 'No auth token' });
    }
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // normalized user shape
    req.user = {
      id: decoded.id || decoded._id || decoded.sub,
      role: decoded.role || 'user'
    };
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function isAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  return next();
}

// (optional) default export for convenience
export default { isAuthenticated, isAdmin };
