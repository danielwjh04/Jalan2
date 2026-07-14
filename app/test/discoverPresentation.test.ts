import { describe, expect, it } from "vitest";
import {
  discoveriesForCatalog,
  sectionFromParam,
} from "../src/lib/discoverPresentation";

describe("Discover presentation", () => {
  it("moves the final two journeys ahead of the Home previews", () => {
    expect(discoveriesForCatalog(["KL", "Penang", "Melaka", "Ipoh", "KK"]))
      .toEqual(["Ipoh", "KK", "KL", "Penang", "Melaka"]);
  });

  it("maps route parameters to a valid section", () => {
    expect(sectionFromParam("operators")).toBe("operators");
    expect(sectionFromParam("places")).toBe("places");
    expect(sectionFromParam(undefined)).toBe("places");
  });
});
