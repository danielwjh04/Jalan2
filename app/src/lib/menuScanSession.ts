import type { MenuResponse } from "@shared/api";

export type PendingMenuScan =
  | { mode: "demo" }
  | { mode: "live"; imageBase64: string; mimeType: "image/jpeg" | "image/png" };

const pending = new Map<string, PendingMenuScan>();
const results = new Map<string, MenuResponse>();

export function createMenuScanSession(scan: PendingMenuScan): string {
  const id = `menu-scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  pending.set(id, scan);
  return id;
}

export function pendingMenuScan(id: string): PendingMenuScan | null {
  return pending.get(id) ?? null;
}

export function cacheMenuResponse(menu: MenuResponse): void {
  results.set(menu.id, menu);
}

export function cachedMenuResponse(id: string): MenuResponse | null {
  return results.get(id) ?? null;
}
