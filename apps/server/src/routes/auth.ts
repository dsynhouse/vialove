import { Router } from 'express';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client.js';
import { users, passwordResetTokens } from '../db/schema.js';
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  generateResetToken,
  hashResetToken,
} from '../lib/auth.js';
import { validateBody, asyncHandler, HttpError } from '../lib/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendMail } from '../lib/mail.js';
import { env } from '../lib/env.js';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

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

const forgotPasswordSchema = z.object({ email: z.string().email().toLowerCase() });

authRouter.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as z.infer<typeof forgotPasswordSchema>;
    const user = db.select().from(users).where(eq(users.email, email)).get();

    // Always respond the same way whether or not the account exists, so this
    // endpoint can't be used to discover which emails have accounts.
    const genericResponse = {
      message: "If an account exists for that email, we've sent a reset link.",
    };

    if (!user) {
      res.json(genericResponse);
      return;
    }

    const { raw, hash } = generateResetToken();
    db.insert(passwordResetTokens)
      .values({
        id: nanoid(),
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
      })
      .run();

    const resetUrl = `${env.clientOrigin}/reset-password?token=${raw}`;
    await sendMail(
      user.email,
      'Reset your vialove password',
      `Hi ${user.name},\n\nSomeone requested a password reset for your vialove account. This link expires in 30 minutes:\n\n${resetUrl}\n\nIf this wasn't you, you can safely ignore this email.`,
    );

    // In non-production, hand the link back directly so the flow is testable
    // without needing real email infrastructure configured.
    res.json(env.smtp ? genericResponse : { ...genericResponse, devResetUrl: resetUrl });
  }),
);

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

authRouter.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as z.infer<typeof resetPasswordSchema>;
    const tokenHash = hashResetToken(token);

    const resetRow = db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)))
      .get();

    if (!resetRow || new Date(resetRow.expiresAt).getTime() < Date.now()) {
      throw new HttpError(400, 'This reset link is invalid or has expired');
    }

    const user = db.select().from(users).where(eq(users.id, resetRow.userId)).get();
    if (!user) throw new HttpError(400, 'This reset link is invalid or has expired');

    const passwordHash = await hashPassword(password);
    db.update(users).set({ passwordHash }).where(eq(users.id, user.id)).run();

    db.update(passwordResetTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(passwordResetTokens.userId, user.id))
      .run();

    const jwt = signToken(user.id);
    setAuthCookie(res, jwt);
    res.json({ id: user.id, email: user.email, name: user.name });
  }),
);
