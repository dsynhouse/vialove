import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './lib/env.js';
import { HttpError } from './lib/validate.js';
import { authRouter } from './routes/auth.js';
import { bondsRouter } from './routes/bonds.js';
import { checkInsRouter } from './routes/checkIns.js';
import { journalRouter } from './routes/journal.js';
import { vaultRouter } from './routes/vault.js';
import { goalsRouter } from './routes/goals.js';
import { weeklyPulsesRouter } from './routes/weeklyPulses.js';
import { eventsRouter } from './routes/events.js';
import { mindfulRouter } from './routes/mindful.js';
import { supportRouter } from './routes/support.js';
import { timelineRouter } from './routes/timeline.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRouter);
  app.use('/api/bonds', bondsRouter);
  app.use('/api/bonds/:bondId/check-ins', checkInsRouter);
  app.use('/api/bonds/:bondId/journal', journalRouter);
  app.use('/api/bonds/:bondId/vault', vaultRouter);
  app.use('/api/bonds/:bondId/goals', goalsRouter);
  app.use('/api/bonds/:bondId/weekly-pulses', weeklyPulsesRouter);
  app.use('/api/bonds/:bondId/events', eventsRouter);
  app.use('/api/bonds/:bondId/mindful-logs', mindfulRouter);
  app.use('/api/bonds/:bondId/support-signals', supportRouter);
  app.use('/api/bonds/:bondId/timeline', timelineRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
