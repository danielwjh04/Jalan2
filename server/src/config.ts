import 'dotenv/config';
import { z } from 'zod';

// .env.example ships these keys blank (KEY=), which dotenv loads as an empty
// string, not undefined. Treat blank the same as absent so a fresh copy of
// .env.example boots instead of failing min(1) on "".
const optionalKey = () =>
  z.preprocess((value) => (value === '' ? undefined : value), z.string().min(1).optional());

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  PIPELINE_MODE: z.enum(['live', 'cached', 'auto']).default('auto'),
  EXTRACTOR: z.enum(['fixture', 'tikhub']).default('fixture'),
  STT_PROVIDER: z.enum(['openai', 'elevenlabs']).default('openai'),
  MESSAGING_PROVIDER: z.enum(['mock', 'twilio', 'telegram']).default('mock'),
  TTS_PROVIDER: z.enum(['elevenlabs', 'cached']).default('cached'),
  ELEVENLABS_API_KEY: optionalKey(),
  ELEVENLABS_VOICE_ID: z.string().default('21m00Tcm4TlvDq8ikWAM'),
  ELEVENLABS_TTS_MODEL: z.string().default('eleven_multilingual_v2'),
  ELEVENLABS_STT_MODEL: z.string().default('scribe_v1'),
  OPENAI_API_KEY: optionalKey(),
  OPENAI_STT_MODEL: z.string().default('whisper-1'),
  OPENAI_VISION_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_FUSION_MODEL: z.string().default('gpt-4o-2024-08-06'),
  OPENAI_MENU_MODEL: z.string().default('gpt-4o-mini'),
  RETRIEVAL_PROVIDER: z.enum(['exa', 'fixture']).default('fixture'),
  EXA_API_KEY: optionalKey(),
  TIKHUB_TOKEN: optionalKey(),
  TWILIO_ACCOUNT_SID: optionalKey(),
  TWILIO_AUTH_TOKEN: optionalKey(),
  TWILIO_WHATSAPP_FROM: z.string().default('whatsapp:+14155238886'),
  OPERATOR_WHATSAPP: optionalKey(),
  TELEGRAM_BOT_TOKEN: optionalKey(),
  OPERATOR_TELEGRAM_CHAT_ID: optionalKey(),
  MOCK_AUTO_CONFIRM_MS: z.coerce.number().int().nonnegative().default(0),
});

export type Config = z.infer<typeof EnvSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  return result.data;
}
