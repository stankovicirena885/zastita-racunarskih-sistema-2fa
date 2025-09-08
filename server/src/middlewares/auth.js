import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid/expired token' });
  }
}
