// ============================================================
// Auth Middleware - JWT Verification
// ============================================================
import { verifyToken } from '../utils/jwt.js';
import { getCookie } from 'hono/cookie';

export async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization');
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    const cookieToken = getCookie(c, 'access_token');
    if (cookieToken) token = cookieToken;
  }
  if (!token) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
    }
    c.set('user', payload);
    await next();
  } catch (e) {
    return c.json({ error: 'Unauthorized: Token verification failed' }, 401);
  }
}

export async function optionalAuth(c, next) {
  const authHeader = c.req.header('Authorization');
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    const cookieToken = getCookie(c, 'access_token');
    if (cookieToken) token = cookieToken;
  }
  if (token) {
    try {
      const payload = await verifyToken(token, c.env.JWT_SECRET);
      if (payload) {
        c.set('user', payload);
      }
    } catch (e) {}
  }
  await next();
}
