import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { hasPermission } from '../lib/permissions.js';

let emailVerifiedEnabled = true;
try {
  await prisma.$queryRaw`SELECT "emailVerified" FROM "User" LIMIT 0`;
} catch {
  emailVerifiedEnabled = false;
}

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  let token;
  if (auth && auth.startsWith('Bearer ')) token = auth.slice(7);
  else token = req.cookies?.accessToken;

  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// Loads full user (with role/permissions) from DB and checks a capability.
export function requirePermission(capability) {
  return async (req, res, next) => {
    const auth = req.headers.authorization;
    let token;
    if (auth && auth.startsWith('Bearer ')) token = auth.slice(7);
    else token = req.cookies?.accessToken;

    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: payload.sub || payload.userId } });
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      if (user.active === false) return res.status(403).json({ success: false, error: 'Account disabled' });
      if (emailVerifiedEnabled && !user.emailVerified) return res.status(403).json({ success: false, error: 'Email non vérifié' });

      req.user = user;
      if (!hasPermission(user, capability)) {
        return res.status(403).json({ success: false, error: 'Forbidden: missing permission ' + capability });
      }
      return next();
    } catch (err) {
      console.error('requirePermission error:', err);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  };
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (req.user.role !== role && req.user.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Forbidden' });
    next();
  };
}