import type { Request, Response, NextFunction } from 'express';
import { getTokenFromRequest, verifyToken } from '../lib/auth.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  req.userId = payload.userId;
  next();
}
