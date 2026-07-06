import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';

describe('loadConfig', () => {
  it('loads with every optional key blank, as .env.example ships them', () => {
    const config = loadConfig({
      OPENAI_API_KEY: '',
      TIKHUB_TOKEN: '',
      TWILIO_ACCOUNT_SID: '',
      TWILIO_AUTH_TOKEN: '',
      OPERATOR_WHATSAPP: '',
      TELEGRAM_BOT_TOKEN: '',
      OPERATOR_TELEGRAM_CHAT_ID: '',
    });
    expect(config.OPENAI_API_KEY).toBeUndefined();
    expect(config.PIPELINE_MODE).toBe('auto');
    expect(config.PORT).toBe(3001);
  });

  it('loads with the optional keys entirely absent', () => {
    const config = loadConfig({});
    expect(config.OPENAI_API_KEY).toBeUndefined();
  });

  it('keeps a real value when one is set', () => {
    const config = loadConfig({ OPENAI_API_KEY: 'sk-test' });
    expect(config.OPENAI_API_KEY).toBe('sk-test');
  });

  it('rejects an invalid enum choice', () => {
    expect(() => loadConfig({ MESSAGING_PROVIDER: 'carrier-pigeon' })).toThrow();
  });
});
