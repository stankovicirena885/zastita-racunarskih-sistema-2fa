import { Router } from 'express';
import User from '../models/User.js';

const r = Router();

r.get('/me', async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return res.status(401).json({ error: 'Unauthenticated' });
  res.json({
    id: user._id,
    email: user.email,
    totpEnabled: user.totp?.enabled ?? false,
  });
});

export default r;
