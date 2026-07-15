import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingJson } from "@shared/booking";
import { loadConfig } from "../src/config";
import {
  createMockProvider,
  MOCK_OPERATOR_ADDRESS,
} from "../src/adapters/messaging/mock";
import type { Retrieval } from "../src/adapters/retrieval/types";
import {
  bookItinerary,
  handleInbound,
  operatorAddressFor,
} from "../src/services/booking";
import { rankedDirectory, resetDirectory } from "../src/store/directory";
import {
  createItinerary,
  getItinerary,
  resetItineraries,
  setBooking,
  setStage,
} from "../src/store/itineraries";

const config = loadConfig({});
const messaging = createMockProvider(0, () => {});
const retrieval: Retrieval = { name: "fixture", search: async () => [] };

const booking: BookingJson = {
  operator_name: "Kuching Dive Adventures",
  activity: "Bako reef dive",
  price_myr: 250,
  pax: 2,
  meeting_point: {
    name: "Bako National Park jetty",
    lat: 1.7169,
    lng: 110.4462,
  },
  contact: { whatsapp: "+60138201122", source: "caption" },
  date_requested: null,
  confidence: 0.88,
  raw_evidence: { transcript_span: "RM250 per person", frame_ts: "14.5s" },
};

function readyItinerary(): string {
  const itinerary = createItinerary("https://tiktok.com/@kuchingdive/video/1");
  setBooking(itinerary.id, booking, "cache");
  setStage(itinerary.id, "READY");
  return itinerary.id;
}

beforeEach(() => {
  resetItineraries();
  resetDirectory();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bookItinerary", () => {
  it("normalizes the configured Twilio operator into a WhatsApp address", () => {
    const twilioConfig = loadConfig({
      MESSAGING_PROVIDER: "twilio",
      OPERATOR_WHATSAPP: "+65 8175 5406",
    });
    expect(operatorAddressFor(twilioConfig)).toBe("whatsapp:+6581755406");
  });

  it("sends the composed message and moves DRAFT to PENDING_CONFIRM", async () => {
    const id = readyItinerary();
    const result = await bookItinerary(messaging, retrieval, config, id, {
      dateISO: "2026-07-12",
      pax: 2,
    });
    expect(result.status).toBe("PENDING_CONFIRM");
    expect(result.operatorAddress).toBe(MOCK_OPERATOR_ADDRESS);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].direction).toBe("outbound");
    expect(result.messages[0].text).toContain("Bako reef dive");
    expect(result.messages[0].text).toContain("Pax: 2");
    expect(result.discoveredOperator).toBeNull();
  });

  it("discovers an operator online when the video evidences no contact", async () => {
    const itinerary = createItinerary("https://tiktok.com/@nocontact/video/9");
    setBooking(itinerary.id, {
      ...booking,
      operator_name: "Unnamed local operator",
      contact: { whatsapp: null, source: "caption" },
    }, "cache");
    setStage(itinerary.id, "READY");
    const found: Retrieval = {
      name: "fixture",
      search: async () => [{
        title: "Sri Bintang Hill Hiking Tours | Book KL guides",
        url: "https://example.my/sri-bintang-tours",
        snippet: "Guided sunrise hikes. WhatsApp 012-345 6789 to book.",
        imageUrl: null,
      }],
    };
    const result = await bookItinerary(messaging, found, config, itinerary.id, {
      dateISO: "2026-07-16",
      pax: 2,
    });
    expect(result.discoveredOperator?.name).toBe("Sri Bintang Hill Hiking Tours");
    expect(result.discoveredOperator?.whatsapp).toBe("+60123456789");
    expect(result.messages[0].text).toContain("Hi Sri Bintang Hill Hiking Tours!");
  });

  it("records demand in the directory", async () => {
    const id = readyItinerary();
    await bookItinerary(messaging, retrieval, config, id, {
      dateISO: "2026-07-12",
      pax: 2,
    });
    const [entry] = rankedDirectory();
    expect(entry.operatorName).toBe("Kuching Dive Adventures");
    expect(entry.optedIn).toBe(false);
  });

  it("rejects itineraries that are not READY drafts", async () => {
    const itinerary = createItinerary(
      "https://tiktok.com/@kuchingdive/video/2",
    );
    await expect(
      bookItinerary(messaging, retrieval, config, itinerary.id, {
        dateISO: "2026-07-12",
        pax: 2,
      }),
    ).rejects.toThrow(/not bookable/);
  });

  it("rejects double booking", async () => {
    const id = readyItinerary();
    await bookItinerary(messaging, retrieval, config, id, {
      dateISO: "2026-07-12",
      pax: 2,
    });
    await expect(
      bookItinerary(messaging, retrieval, config, id, { dateISO: "2026-07-13", pax: 3 }),
    ).rejects.toThrow(/not bookable/);
  });
});

describe("handleInbound", () => {
  it("confirms the pending itinerary on YES and opts the operator in", async () => {
    const id = readyItinerary();
    await bookItinerary(messaging, retrieval, config, id, {
      dateISO: "2026-07-12",
      pax: 2,
    });
    const updated = handleInbound({
      from: MOCK_OPERATOR_ADDRESS,
      text: "YES can!",
    });
    expect(updated?.id).toBe(id);
    expect(updated?.status).toBe("CONFIRMED");
    expect(rankedDirectory()[0].optedIn).toBe(true);
  });

  it("keeps the itinerary pending on a non-confirmation reply", async () => {
    const id = readyItinerary();
    await bookItinerary(messaging, retrieval, config, id, {
      dateISO: "2026-07-12",
      pax: 2,
    });
    const updated = handleInbound({
      from: MOCK_OPERATOR_ADDRESS,
      text: "who is this?",
    });
    expect(updated?.status).toBe("PENDING_CONFIRM");
    expect(getItinerary(id)?.messages).toHaveLength(2);
    expect(rankedDirectory()[0].optedIn).toBe(false);
  });

  it("returns null when nothing is pending", () => {
    expect(
      handleInbound({ from: MOCK_OPERATOR_ADDRESS, text: "YES" }),
    ).toBeNull();
  });

  it("ignores a reply from an address no booking was sent to", async () => {
    const id = readyItinerary();
    await bookItinerary(messaging, retrieval, config, id, {
      dateISO: "2026-07-12",
      pax: 2,
    });
    expect(
      handleInbound({ from: "whatsapp:+60000000000", text: "YES" }),
    ).toBeNull();
    expect(getItinerary(id)?.status).toBe("PENDING_CONFIRM");
    expect(rankedDirectory()[0].optedIn).toBe(false);
  });

  it("still confirms from the matching operator address", async () => {
    const id = readyItinerary();
    await bookItinerary(messaging, retrieval, config, id, {
      dateISO: "2026-07-12",
      pax: 2,
    });
    handleInbound({ from: "unknown:sender", text: "YES" });
    const updated = handleInbound({ from: MOCK_OPERATOR_ADDRESS, text: "YES" });
    expect(updated?.id).toBe(id);
    expect(updated?.status).toBe("CONFIRMED");
  });
});
