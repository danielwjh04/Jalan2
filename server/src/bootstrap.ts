import OpenAI from "openai";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { pickExtractor } from "./adapters/extractor";
import { pickMessagingProvider } from "./adapters/messaging";
import { pickRetrieval } from "./adapters/retrieval";
import { createRouting } from "./adapters/routing";
import { createPlaces } from "./adapters/places";
import { createWikimediaPlaceImages } from "./adapters/foodImages/wikimedia";
import { createLicensedFoodImages } from "./adapters/foodImages/licensed";
import { withLicensedPlaceImages } from "./adapters/places/withImages";
import { pickStt } from "./adapters/stt";
import { pickTts } from "./adapters/tts";
import { deliverInbound } from "./routes/webhooks";

export function createConfiguredApp() {
  const config = loadConfig();
  const openai = config.OPENAI_API_KEY
    ? new OpenAI({ apiKey: config.OPENAI_API_KEY })
    : null;
  const messaging = pickMessagingProvider(
    config,
    (message) => void deliverInbound(message),
  );
  const retrieval = pickRetrieval(config);
  const places = withLicensedPlaceImages(
    createPlaces(config),
    createWikimediaPlaceImages(),
  );
  const routing = createRouting(config);

  const app = createApp({
    config,
    messaging,
    tts: pickTts(config),
    retrieval,
    routing,
    places,
    foodImages: createLicensedFoodImages(config.UNSPLASH_ACCESS_KEY, places),
    pipeline: {
      config,
      extractor: pickExtractor(config),
      stt: pickStt(config, openai),
      openai,
      retrieval,
      places,
      routing,
    },
  });

  return { app, config, openai };
}
