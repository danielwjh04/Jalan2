import { z } from 'zod';
import type { Config } from '../../config';
import { NotConfiguredError } from '../../lib/errors';
import type { InboundMessage, MessagingProvider } from './types';

const SendResponseSchema = z.object({
  ok: z.boolean(),
  result: z.object({ message_id: z.number() }).optional(),
  description: z.string().optional(),
});

export function createTelegramProvider(config: Config): MessagingProvider {
  const token = config.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new NotConfiguredError(
      'Telegram',
      'Set TELEGRAM_BOT_TOKEN, or MESSAGING_PROVIDER=mock.',
    );
  }
  return {
    name: 'telegram',
    async sendBookingRequest(to, body) {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: to, text: body }),
      });
      const data = SendResponseSchema.parse(await response.json());
      if (!data.ok || !data.result) {
        throw new Error(`Telegram send failed: ${data.description ?? response.status}`);
      }
      return { messageId: String(data.result.message_id) };
    },
  };
}

const TelegramUpdateSchema = z.object({
  message: z
    .object({
      chat: z.object({ id: z.union([z.number(), z.string()]) }),
      text: z.string().optional(),
    })
    .optional(),
});

export function parseTelegramInbound(payload: unknown): InboundMessage | null {
  const result = TelegramUpdateSchema.safeParse(payload);
  if (!result.success || !result.data.message?.text) return null;
  return { from: String(result.data.message.chat.id), text: result.data.message.text };
}
