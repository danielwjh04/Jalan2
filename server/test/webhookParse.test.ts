import { describe, expect, it } from "vitest";
import { parseMockInbound } from "../src/adapters/messaging/mock";
import { parseTelegramInbound } from "../src/adapters/messaging/telegram";
import {
  normalizeTwilioWhatsAppAddress,
  parseTwilioInbound,
} from "../src/adapters/messaging/twilio";
import { referencedAutoReply } from "../src/adapters/messaging/mock";

describe("parseTwilioInbound", () => {
  it("normalizes phone numbers into Twilio WhatsApp addresses", () => {
    expect(normalizeTwilioWhatsAppAddress("+65 8175 5406")).toBe(
      "whatsapp:+6581755406",
    );
    expect(normalizeTwilioWhatsAppAddress("whatsapp:+60138201122")).toBe(
      "whatsapp:+60138201122",
    );
  });

  it("parses the sandbox form payload", () => {
    const payload = {
      SmsMessageSid: "SM123",
      From: "whatsapp:+60123456789",
      To: "whatsapp:+14155238886",
      Body: "YES",
    };
    expect(parseTwilioInbound(payload)).toEqual({
      from: "whatsapp:+60123456789",
      text: "YES",
    });
  });

  it("rejects payloads without From or Body", () => {
    expect(parseTwilioInbound({ Body: "YES" })).toBeNull();
    expect(parseTwilioInbound({ From: "whatsapp:+60123456789" })).toBeNull();
    expect(parseTwilioInbound("not an object")).toBeNull();
  });
});

describe("parseTelegramInbound", () => {
  it("parses a message update using chat id as the address", () => {
    const update = {
      update_id: 1001,
      message: {
        message_id: 7,
        chat: { id: 987654321, type: "private" },
        text: "YES",
      },
    };
    expect(parseTelegramInbound(update)).toEqual({
      from: "987654321",
      text: "YES",
    });
  });

  it("ignores updates without message text", () => {
    expect(
      parseTelegramInbound({ update_id: 1002, message: { chat: { id: 1 } } }),
    ).toBeNull();
    expect(parseTelegramInbound({ update_id: 1003 })).toBeNull();
  });
});

describe("parseMockInbound", () => {
  it("keeps a reservation reference in automatic confirmations", () => {
    expect(referencedAutoReply("Reply YES J2-K4P7 to confirm")).toBe("YES J2-K4P7");
    expect(referencedAutoReply("Reply YES to confirm")).toBe("YES");
  });

  it("parses from and text", () => {
    expect(parseMockInbound({ from: "mock:operator", text: "YES" })).toEqual({
      from: "mock:operator",
      text: "YES",
    });
  });

  it("rejects missing fields", () => {
    expect(parseMockInbound({ text: "YES" })).toBeNull();
    expect(parseMockInbound({ from: "" })).toBeNull();
  });
});
