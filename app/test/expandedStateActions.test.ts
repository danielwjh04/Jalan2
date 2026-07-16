import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const directory = dirname(fileURLToPath(import.meta.url));
const read = (name: string): string => readFileSync(resolve(directory, `../src/components/${name}.tsx`), "utf8");

describe("expanded itinerary actions", () => {
  it("keeps optimize in the itinerary header when reorder is expanded", () => {
    const list = read("TripStopList");
    const editors = [read("TripOrderEditor"), read("TripOrderEditor.web")];

    expect(list).toContain('<ActionButton variant="tonal" label="Optimise" style={styles.tool} onPress={() => void props.onOptimize()} />');
    expect(list).toContain('<TripOrderEditor stops={props.trip.stops} selected={props.selected} busy={props.busy} onReorder={props.onReorder} />');
    expect(list).not.toContain("onOptimize={props.onOptimize}");
    for (const editor of editors) {
      expect(editor).not.toContain("onOptimize: () => Promise<void>;");
      expect(editor).not.toContain("props.onOptimize");
      expect(editor).not.toContain("styles.optimize");
    }
  });

  it("renders the expanded Search action with tonal tokens", () => {
    const search = read("DestinationSearch");

    expect(search).toContain('<Pressable style={[styles.searchButton, props.busy && styles.disabled]} disabled={disabled} onPress={() => void props.onSearch(props.query)}><Text style={styles.searchText}>Search</Text></Pressable>');
    expect(search).toMatch(/searchButton:\s*{[^}]*backgroundColor:\s*colors\.halo/);
    expect(search).toMatch(/searchText:\s*{[^}]*color:\s*colors\.sageDeep/);
    expect(search).not.toMatch(/search(?:Button|Text):\s*{[^}]*colors\.(?:kaya|kayaTint|kopi)/);
  });
});
