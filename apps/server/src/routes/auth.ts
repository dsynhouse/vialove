import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { hashPassword, verifyPassword, signToken, setAuthCookie, clearAuthCookie } from '../lib/auth.js';
import { validateBody, asyncHandler, HttpError } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().min(1, 'Name is required').max(60),
});

authRouter.post(
  '/signup',
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body as z.infer<typeof signupSchema>;

    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) throw new HttpError(409, 'An account with that email already exists');

    const passwordHash = await hashPassword(password);
    const id = nanoid();
    db.insert(users).values({ id, email, passwordHash, name }).run();

    const token = signToken(id);
    setAuthCookie(res, token);
    res.status(201).json({ id, email, name });
  }),
);

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user) throw new HttpError(401, 'Invalid email or password');

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new HttpError(401, 'Invalid email or password');

    const token = signToken(user.id);
    setAuthCookie(res, token);
    res.json({ id: user.id, email: user.email, name: user.name });
  }),
);

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = db.select().from(users).where(eq(users.id, req.userId!)).get();
    if (!user) throw new HttpError(404, 'User not found');
    res.json({ id: user.id, email: user.email, name: user.name });
  }),
);
