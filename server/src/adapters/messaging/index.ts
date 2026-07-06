import type { Config } from '../../config';
import { createMockProvider } from './mock';
import { createTelegramProvider } from './telegram';
import { createTwilioProvider } from './twilio';
import type { InboundMessage, MessagingProvider } from './types';

export function pickMessagingProvider(
  config: Config,
  deliverInbound: (message: InboundMessage) => void,
): MessagingProvider {
  switch (config.MESSAGING_PROVIDER) {
    case 'twilio':
      return createTwilioProvider(config);
    case 'telegram':
      return createTelegramProvider(config);
    case 'mock':
      return createMockProvider(config.MOCK_AUTO_CONFIRM_MS, deliverInbound);
  }
}
