export type DiscoverSection = "places" | "operators";

export function sectionFromParam(value: string | undefined): DiscoverSection {
  return value === "operators" ? "operators" : "places";
}

export function discoveriesForCatalog<T>(discoveries: readonly T[]): T[] {
  const tailStart = Math.max(0, discoveries.length - 2);
  return [
    ...discoveries.slice(tailStart),
    ...discoveries.slice(0, tailStart),
  ];
}
