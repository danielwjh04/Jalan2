import { describe, expect, it } from "vitest";
import { parseApiResponse } from "../src/lib/httpResponse";

describe("parseApiResponse", () => {
  it("preserves a JSON error returned by the API", async () => {
    const response = new Response(JSON.stringify({ error: "Unknown trip" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });

    await expect(parseApiResponse(response)).rejects.toThrow("Unknown trip");
  });

  it("turns a non-JSON gateway response into a useful status error", async () => {
    const response = new Response("Bad Gateway", {
      status: 502,
      headers: { "content-type": "text/plain" },
    });

    await expect(parseApiResponse(response)).rejects.toThrow(
      "Request failed with status 502",
    );
  });
});
