import express, { type Express } from 'express';
import type { Config } from './config';
import type { MessagingProvider } from './adapters/messaging/types';
import type { TextToSpeech } from './adapters/tts/types';
import type { PipelineDeps } from './pipeline/run';
import { bookRouter } from './routes/book';
import { directoryRouter } from './routes/directory';
import { fixturesRouter } from './routes/fixtures';
import { ingestRouter } from './routes/ingest';
import { itineraryRouter } from './routes/itinerary';
import { voiceRouter } from './routes/voice';
import { webhooksRouter } from './routes/webhooks';

export interface ServerContext {
  config: Config;
  pipeline: PipelineDeps;
  messaging: MessagingProvider;
  tts: TextToSpeech;
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
  app.use(voiceRouter(ctx.config, ctx.tts));
  app.use(webhooksRouter());
  return app;
}
