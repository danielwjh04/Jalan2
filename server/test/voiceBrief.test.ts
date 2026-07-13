import { describe, expect, it } from "vitest";
import type { BookingJson } from "@shared/booking";
import { composeBrief } from "../src/voice/brief";
import { loadConfig } from "../src/config";
import { createCachedTts } from "../src/adapters/tts/cached";
import { briefClip } from "../src/services/voice";

function booking(overrides: Partial<BookingJson> = {}): BookingJson {
  return {
    operator_name: "Bako Boat Crew",
    activity: "Bako reef dive",
    price_myr: 80,
    pax: 2,
    meeting_point: {
      name: "Bako National Park jetty",
      lat: 1.7169,
      lng: 110.4462,
    },
    contact: { whatsapp: null, source: "caption" },
    date_requested: null,
    confidence: 0.8,
    raw_evidence: { transcript_span: "dive at Bako", frame_ts: "3.2s" },
    ...overrides,
  };
}

describe("composeBrief", () => {
  it("is deterministic for the same booking", () => {
    expect(composeBrief(booking(), "en")).toBe(composeBrief(booking(), "en"));
  });

  it("produces different text per language", () => {
    expect(composeBrief(booking(), "en")).not.toBe(
      composeBrief(booking(), "ms"),
    );
    expect(composeBrief(booking(), "ms")).toContain("taklimat keselamatan");
    expect(composeBrief(booking(), "zh")).toContain("安全提示");
  });

  it("mentions the evidenced price and skips it when null", () => {
    expect(composeBrief(booking(), "en")).toContain("80 ringgit");
    expect(composeBrief(booking({ price_myr: null }), "en")).not.toContain(
      "ringgit per person",
    );
  });

  it("picks water guidance for boat and dive activities", () => {
    expect(composeBrief(booking(), "en")).toContain("life jacket");
    expect(
      composeBrief(booking({ activity: "Street food walk" }), "en"),
    ).not.toContain("life jacket");
  });

  it("always closes with the advisory line", () => {
    expect(composeBrief(booking(), "en")).toContain(
      "general advisory guidance",
    );
    expect(composeBrief(booking(), "ms")).toContain("panduan umum");
  });
});

describe("briefClip", () => {
  it("finds prepared audio when given a raw short video URL", async () => {
    const clip = await briefClip(
      { config: loadConfig({}), tts: createCachedTts() },
      "https://vt.tiktok.com/ZSCt5cY1k/",
      "Safety brief",
      "en",
    );
    expect(clip.audioUrl).toBe("/voice/audio/kuching-city-guide-01.en.mp3");
    expect(clip.servedFrom).toBe("fixture");
  });
});
