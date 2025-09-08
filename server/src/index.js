import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import { requireAuth } from './middlewares/auth.js';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: env.appUrl,
    credentials: true,
  })
);

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api', requireAuth, meRoutes);

mongoose.connect(env.mongoUrl).then(() => {
  app.listen(env.port, () => console.log(`API on :${env.port}`));
});
