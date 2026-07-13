import twilio from "twilio";
import { z } from "zod";
import type { Config } from "../../config";
import { NotConfiguredError } from "../../lib/errors";
import type { InboundMessage, MessagingProvider } from "./types";

export function createTwilioProvider(config: Config): MessagingProvider {
  const sid = config.TWILIO_ACCOUNT_SID;
  const token = config.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new NotConfiguredError(
      "Twilio",
      "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN, or MESSAGING_PROVIDER=mock.",
    );
  }
  const from = normalizeTwilioWhatsAppAddress(config.TWILIO_WHATSAPP_FROM);
  if (!from)
    throw new NotConfiguredError(
      "Twilio WhatsApp sender",
      "Set TWILIO_WHATSAPP_FROM.",
    );
  const client = twilio(sid, token);
  return {
    name: "twilio",
    async sendBookingRequest(to, body) {
      const destination = normalizeTwilioWhatsAppAddress(to);
      if (!destination) throw new Error("Operator WhatsApp number is invalid");
      const message = await client.messages.create({
        from,
        to: destination,
        body,
      });
      return { messageId: message.sid };
    },
  };
}

const TwilioInboundSchema = z.object({
  From: z.string().min(1),
  Body: z.string(),
});

export function normalizeTwilioWhatsAppAddress(
  value: string | undefined,
): string | null {
  const digits = value?.replace(/^whatsapp:/i, "").replace(/\D/g, "") ?? "";
  return digits.length >= 8 && digits.length <= 15
    ? `whatsapp:+${digits}`
    : null;
}

export function parseTwilioInbound(payload: unknown): InboundMessage | null {
  const result = TwilioInboundSchema.safeParse(payload);
  if (!result.success) return null;
  const from = normalizeTwilioWhatsAppAddress(result.data.From);
  return from ? { from, text: result.data.Body } : null;
}
