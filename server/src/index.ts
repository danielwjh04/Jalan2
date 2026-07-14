import OpenAI from "openai";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { pickExtractor } from "./adapters/extractor";
import { pickMessagingProvider } from "./adapters/messaging";
import { pickRetrieval } from "./adapters/retrieval";
import { createRouting } from "./adapters/routing";
import { createPlaces } from "./adapters/places";
import {
  createWikimediaFoodImages,
  createWikimediaPlaceImages,
} from "./adapters/foodImages/wikimedia";
import { withLicensedPlaceImages } from "./adapters/places/withImages";
import { pickStt } from "./adapters/stt";
import { pickTts } from "./adapters/tts";
import { handleInbound } from "./services/booking";

const config = loadConfig();
const openai = config.OPENAI_API_KEY
  ? new OpenAI({ apiKey: config.OPENAI_API_KEY })
  : null;
const messaging = pickMessagingProvider(
  config,
  (message) => void handleInbound(message),
);
const retrieval = pickRetrieval(config);
const places = withLicensedPlaceImages(createPlaces(config), createWikimediaPlaceImages());

const app = createApp({
  config,
  messaging,
  tts: pickTts(config),
  retrieval,
  routing: createRouting(config),
  places,
  foodImages: createWikimediaFoodImages(),
  pipeline: {
    config,
    extractor: pickExtractor(config),
    stt: pickStt(config, openai),
    openai,
    retrieval,
    places,
  },
});

app.listen(config.PORT, () => {
  console.info(
    `jalan2 server on :${config.PORT} ` +
      `(pipeline=${config.PIPELINE_MODE}, extractor=${config.EXTRACTOR}, ` +
      `messaging=${config.MESSAGING_PROVIDER}, openai=${openai ? "configured" : "absent"})`,
  );
});
