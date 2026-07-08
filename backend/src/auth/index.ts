import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';

const COOKIE_NAME = 'session';
const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true as const,
  // Cross-site cookies (GitHub Pages -> home server) require Secure+SameSite=None,
  // but browsers drop Secure cookies over plain http:// used in local dev.
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
};

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  if (!password) return res.status(400).json({ error: 'password required' });

  const ok = await bcrypt.compare(password, env.masterPasswordHash);
  if (!ok) return res.status(401).json({ error: 'invalid password' });

  const token = jwt.sign({ sub: 'admin' }, env.jwtSecret, { expiresIn: '30d' });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.json({ ok: true });
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ ok: true });
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'unauthenticated' });
  try {
    jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'unauthenticated' });
  }
}
