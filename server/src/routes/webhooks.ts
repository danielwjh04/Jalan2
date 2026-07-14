import { Router } from 'express';
import { parseMockInbound } from '../adapters/messaging/mock';
import { parseTelegramInbound } from '../adapters/messaging/telegram';
import { parseTwilioInbound } from '../adapters/messaging/twilio';
import type { InboundMessage } from '../adapters/messaging/types';
import { handleInbound } from '../services/booking';
import { handleTripReservationInbound } from '../services/tripReservations';

export function webhooksRouter(): Router {
  const router = Router();

  router.post('/webhooks/twilio', (req, res) => {
    deliver(parseTwilioInbound(req.body));
    res.type('text/xml').send('<Response></Response>');
  });

  router.post('/webhooks/telegram', (req, res) => {
    deliver(parseTelegramInbound(req.body));
    res.json({ ok: true });
  });

  router.post('/webhooks/mock', (req, res) => {
    const message = parseMockInbound(req.body);
    if (!message) {
      res.status(400).json({ error: 'Body must include from and text' });
      return;
    }
    const updated = deliverInbound(message);
    res.json({ matched: updated?.id ?? null, status: updated?.status ?? null });
  });

  return router;
}

function deliver(message: InboundMessage | null): void {
  if (message) deliverInbound(message);
}

export function deliverInbound(message: InboundMessage) {
  return handleTripReservationInbound(message) ?? handleInbound(message);
}
