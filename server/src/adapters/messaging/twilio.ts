import twilio from 'twilio';
import { z } from 'zod';
import type { Config } from '../../config';
import { NotConfiguredError } from '../../lib/errors';
import type { InboundMessage, MessagingProvider } from './types';

export function createTwilioProvider(config: Config): MessagingProvider {
  const sid = config.TWILIO_ACCOUNT_SID;
  const token = config.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new NotConfiguredError(
      'Twilio',
      'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN, or MESSAGING_PROVIDER=mock.',
    );
  }
  const client = twilio(sid, token);
  return {
    name: 'twilio',
    async sendBookingRequest(to, body) {
      const message = await client.messages.create({
        from: config.TWILIO_WHATSAPP_FROM,
        to,
        body,
      });
      return { messageId: message.sid };
    },
  };
}

const TwilioInboundSchema = z.object({ From: z.string().min(1), Body: z.string() });

export function parseTwilioInbound(payload: unknown): InboundMessage | null {
  const result = TwilioInboundSchema.safeParse(payload);
  return result.success ? { from: result.data.From, text: result.data.Body } : null;
}
