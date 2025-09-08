import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import User from '../models/User.js';
import LoginTicket from '../models/LoginTicket.js';
import { signAccess, signRefresh } from '../lib/jwt.js';
import { authLimiter } from '../lib/rateLimit.js';
import { env } from '../config/env.js';
import { generateTotpSecret, otpauthToPng, verifyTotp } from '../lib/totp.js';
import { requireAuth } from '../middlewares/auth.js';
import { verifyRecaptcha } from '../lib/recaptcha.js';

const r = Router();

function setAuthCookies(res, access, refresh) {
  const cookieBase = {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    domain: env.cookieDomain,
    path: '/',
  };
  res.cookie('access_token', access, cookieBase);
  res.cookie('refresh_token', refresh, cookieBase);
}

r.post('/register', authLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    recaptchaToken: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid payload' });

  const { email, password, recaptchaToken } = parsed.data;

  const human = await verifyRecaptcha(recaptchaToken, req.ip);
  if (!human) return res.status(400).json({ error: 'reCAPTCHA failed' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'Email already used' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash });

  const access = signAccess({ sub: user._id.toString() });
  const refresh = signRefresh({ sub: user._id.toString() });
  setAuthCookies(res, access, refresh);

  res.json({
    ok: true,
    user: { id: user._id, email: user.email, totpEnabled: user.totp.enabled },
  });
});

r.post('/login', authLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    recaptchaToken: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: 'Invalid payload' });

  const { email, password, recaptchaToken } = parsed.data;

  const human = await verifyRecaptcha(recaptchaToken, req.ip);
  if (!human) return res.status(400).json({ error: 'reCAPTCHA failed' });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  if (user.totp?.enabled) {
    const ticket = await LoginTicket.create({
      userId: user._id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    return res.json({ need2fa: true, ticketId: ticket._id });
  }

  const access = signAccess({ sub: user._id.toString() });
  const refresh = signRefresh({ sub: user._id.toString() });
  setAuthCookies(res, access, refresh);
  res.json({
    ok: true,
    user: { id: user._id, email: user.email, totpEnabled: user.totp.enabled },
  });
});

r.post('/2fa/totp/verify', authLimiter, async (req, res) => {
  const schema = z.object({
    ticketId: z.string(),
    code: z.string().min(6).max(6),
  });
  const body = schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid payload' });

  const { ticketId, code } = body.data;
  const ticket = await LoginTicket.findById(ticketId);
  if (!ticket) return res.status(400).json({ error: 'Invalid/expired ticket' });

  const user = await User.findById(ticket.userId);
  if (!user || !user.totp?.enabled || !user.totp.secret) {
    return res.status(400).json({ error: '2FA not enabled' });
  }

  const valid = verifyTotp(code, user.totp.secret);
  if (!valid) return res.status(401).json({ error: 'Invalid 2FA code' });

  await ticket.deleteOne();
  const access = signAccess({ sub: user._id.toString() });
  const refresh = signRefresh({ sub: user._id.toString() });
  setAuthCookies(res, access, refresh);
  res.json({
    ok: true,
    user: { id: user._id, email: user.email, totpEnabled: true },
  });
});

r.post('/2fa/totp/setup', requireAuth, authLimiter, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Unauthenticated' });

  const { secret, otpauth } = generateTotpSecret(user.email);
  const pngDataUrl = await otpauthToPng(otpauth);

  user.totp = { enabled: false, secret, enabledAt: null };
  await user.save();

  res.json({ otpauth, qrPngDataUrl: pngDataUrl });
});

r.post('/2fa/totp/enable', requireAuth, authLimiter, async (req, res) => {
  const schema = z.object({ code: z.string().min(6).max(6) });
  const body = schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid payload' });

  const user = await User.findById(req.userId);
  if (!user || !user.totp?.secret)
    return res.status(400).json({ error: 'No TOTP to enable' });

  const ok = verifyTotp(body.data.code, user.totp.secret);
  if (!ok) return res.status(400).json({ error: 'Invalid code' });

  user.totp.enabled = true;
  user.totp.enabledAt = new Date();
  await user.save();
  res.json({ ok: true, totpEnabled: true });
});

r.post('/2fa/totp/disable', requireAuth, authLimiter, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Unauthenticated' });
  user.totp = { enabled: false, secret: null, enabledAt: null };
  await user.save();
  res.json({ ok: true, totpEnabled: false });
});

r.post('/logout', (req, res) => {
  res.clearCookie('access_token', { domain: env.cookieDomain, path: '/' });
  res.clearCookie('refresh_token', { domain: env.cookieDomain, path: '/' });
  res.json({ ok: true });
});

export default r;
