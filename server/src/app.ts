import express, { type Express } from "express";
import type { Config } from "./config";
import type { MessagingProvider } from "./adapters/messaging/types";
import type { Retrieval } from "./adapters/retrieval/types";
import type { RoutingProvider } from "./adapters/routing/types";
import type { PlacesProvider } from "./adapters/places/types";
import type { FoodImageProvider } from "./adapters/foodImages/types";
import type { TextToSpeech } from "./adapters/tts/types";
import type { PipelineDeps } from "./pipeline/run";
import { bookRouter } from "./routes/book";
import { directoryRouter } from "./routes/directory";
import { fixturesRouter } from "./routes/fixtures";
import { ingestRouter } from "./routes/ingest";
import { itineraryRouter } from "./routes/itinerary";
import { menuRouter } from "./routes/menu";
import { placePhotosRouter } from "./routes/placePhotos";
import { reviewsRouter } from "./routes/reviews";
import { sourceCoversRouter } from "./routes/sourceCovers";
import { tripsRouter } from "./routes/trips";
import { voiceRouter } from "./routes/voice";
import { webhooksRouter } from "./routes/webhooks";
import { localWebCors } from "./lib/cors";

export interface ServerContext {
  config: Config;
  pipeline: PipelineDeps;
  messaging: MessagingProvider;
  tts: TextToSpeech;
  retrieval: Retrieval;
  routing: RoutingProvider;
  places: PlacesProvider;
  foodImages: FoodImageProvider;
}

export function createApp(ctx: ServerContext): Express {
  const app = express();
  app.use(localWebCors);
  // Menu uploads carry base64 photos, so that router parses its own body with
  // a larger limit and must mount before the global 1mb parser.
  app.use(
    menuRouter(
      {
        config: ctx.config,
        openai: ctx.pipeline.openai,
        foodImages: ctx.foodImages,
      },
      ctx.tts,
    ),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use(ingestRouter(ctx.pipeline));
  app.use(itineraryRouter());
  app.use(placePhotosRouter(ctx.places));
  app.use(tripsRouter(ctx.routing, ctx.places));
  app.use(bookRouter(ctx.messaging, ctx.config));
  app.use(directoryRouter());
  app.use(reviewsRouter());
  app.use(sourceCoversRouter());
  app.use(fixturesRouter());
  app.use(voiceRouter(ctx.config, ctx.tts));
  app.use(webhooksRouter());
  return app;
}
