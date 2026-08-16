import { env } from './config/env.js';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';

const app = express();

app.use(cors({ origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(','), credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));
app.use(generalLimiter);

app.get('/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`[server] GoPlanner API listening on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});

export default app;
