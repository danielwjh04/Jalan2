import { describe, expect, it } from 'vitest';
import { parseMockInbound } from '../src/adapters/messaging/mock';
import { parseTelegramInbound } from '../src/adapters/messaging/telegram';
import { parseTwilioInbound } from '../src/adapters/messaging/twilio';

describe('parseTwilioInbound', () => {
  it('parses the sandbox form payload', () => {
    const payload = {
      SmsMessageSid: 'SM123',
      From: 'whatsapp:+60123456789',
      To: 'whatsapp:+14155238886',
      Body: 'YES',
    };
    expect(parseTwilioInbound(payload)).toEqual({ from: 'whatsapp:+60123456789', text: 'YES' });
  });

  it('rejects payloads without From or Body', () => {
    expect(parseTwilioInbound({ Body: 'YES' })).toBeNull();
    expect(parseTwilioInbound({ From: 'whatsapp:+60123456789' })).toBeNull();
    expect(parseTwilioInbound('not an object')).toBeNull();
  });
});

describe('parseTelegramInbound', () => {
  it('parses a message update using chat id as the address', () => {
    const update = {
      update_id: 1001,
      message: {
        message_id: 7,
        chat: { id: 987654321, type: 'private' },
        text: 'YES',
      },
    };
    expect(parseTelegramInbound(update)).toEqual({ from: '987654321', text: 'YES' });
  });

  it('ignores updates without message text', () => {
    expect(parseTelegramInbound({ update_id: 1002, message: { chat: { id: 1 } } })).toBeNull();
    expect(parseTelegramInbound({ update_id: 1003 })).toBeNull();
  });
});

describe('parseMockInbound', () => {
  it('parses from and text', () => {
    expect(parseMockInbound({ from: 'mock:operator', text: 'YES' })).toEqual({
      from: 'mock:operator',
      text: 'YES',
    });
  });

  it('rejects missing fields', () => {
    expect(parseMockInbound({ text: 'YES' })).toBeNull();
    expect(parseMockInbound({ from: '' })).toBeNull();
  });
});
