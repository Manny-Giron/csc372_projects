import { verifyToken } from './auth.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.sub, email: decoded.email, roles: decoded.roles || [] };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const ok = allowed.some((r) => req.user.roles.includes(r));
    if (!ok) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
