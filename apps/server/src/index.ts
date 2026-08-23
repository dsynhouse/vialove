import { createServer } from 'node:http';
import { runMigrations } from './db/migrate.js';
import { createApp } from './app.js';
import { initRealtime } from './realtime.js';
import { env } from './lib/env.js';

runMigrations();

const app = createApp();
const httpServer = createServer(app);
initRealtime(httpServer);

httpServer.listen(env.port, () => {
  console.log(`vialove server listening on :${env.port}`);
});
