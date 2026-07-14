import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { InboundMessage, MessagingProvider } from './types';

export const MOCK_OPERATOR_ADDRESS = 'mock:operator';

export function createMockProvider(
  autoConfirmMs: number,
  deliverInbound: (message: InboundMessage) => void,
): MessagingProvider {
  return {
    name: 'mock',
    async sendBookingRequest(to, body) {
      console.info(`[mock messaging] -> ${to}\n${body}`);
      if (autoConfirmMs > 0) {
        setTimeout(
          () => deliverInbound({ from: to, text: referencedAutoReply(body) }),
          autoConfirmMs,
        ).unref();
      }
      return { messageId: randomUUID() };
    },
  };
}

export function referencedAutoReply(body: string): string {
  const reference = body.toUpperCase().match(/\bJ2-[A-Z0-9]{4,8}\b/)?.[0];
  return reference ? `YES ${reference}` : 'YES';
}

const MockInboundSchema = z.object({ from: z.string().min(1), text: z.string() });

export function parseMockInbound(payload: unknown): InboundMessage | null {
  const result = MockInboundSchema.safeParse(payload);
  return result.success ? result.data : null;
}
