import express, { type Express } from 'express';
import type { Config } from './config';
import type { MessagingProvider } from './adapters/messaging/types';
import type { PipelineDeps } from './pipeline/run';
import { bookRouter } from './routes/book';
import { directoryRouter } from './routes/directory';
import { fixturesRouter } from './routes/fixtures';
import { ingestRouter } from './routes/ingest';
import { itineraryRouter } from './routes/itinerary';
import { webhooksRouter } from './routes/webhooks';

export interface ServerContext {
  config: Config;
  pipeline: PipelineDeps;
  messaging: MessagingProvider;
}

export function createApp(ctx: ServerContext): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use(ingestRouter(ctx.pipeline));
  app.use(itineraryRouter());
  app.use(bookRouter(ctx.messaging, ctx.config));
  app.use(directoryRouter());
  app.use(fixturesRouter());
  app.use(webhooksRouter());
  return app;
}
