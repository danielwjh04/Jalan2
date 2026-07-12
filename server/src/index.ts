import OpenAI from 'openai';
import { createApp } from './app';
import { loadConfig } from './config';
import { pickExtractor } from './adapters/extractor';
import { pickMessagingProvider } from './adapters/messaging';
import { pickStt } from './adapters/stt';
import { pickTts } from './adapters/tts';
import { handleInbound } from './services/booking';

const config = loadConfig();
const openai = config.OPENAI_API_KEY ? new OpenAI({ apiKey: config.OPENAI_API_KEY }) : null;
const messaging = pickMessagingProvider(config, (message) => void handleInbound(message));

const app = createApp({
  config,
  messaging,
  tts: pickTts(config),
  pipeline: {
    config,
    extractor: pickExtractor(config),
    stt: pickStt(config, openai),
    openai,
  },
});

app.listen(config.PORT, () => {
  console.info(
    `jalan2 server on :${config.PORT} ` +
      `(pipeline=${config.PIPELINE_MODE}, extractor=${config.EXTRACTOR}, ` +
      `messaging=${config.MESSAGING_PROVIDER}, openai=${openai ? 'configured' : 'absent'})`,
  );
});
