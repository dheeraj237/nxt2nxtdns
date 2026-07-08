import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './env.js';
import { authRouter, requireAuth } from './auth/index.js';
import { accountsRouter } from './routes/accounts.js';
import { profilesRouter } from './routes/profiles.js';
import { syncRouter } from './routes/sync.js';
import './db/client.js';

const app = express();
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/accounts', requireAuth, accountsRouter);
app.use('/api/profiles', requireAuth, profilesRouter);
app.use('/api/sync', requireAuth, syncRouter);

app.listen(env.port, () => {
  console.log(`Backend listening on :${env.port}`);
});
