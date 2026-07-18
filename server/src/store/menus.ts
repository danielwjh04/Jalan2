import { randomUUID } from 'node:crypto';
import type { MenuJson } from '@shared/menu';

export interface StoredMenu {
  id: string;
  menu: MenuJson;
  servedFrom: 'live' | 'cache';
  dishAudio: (string | null)[];
  sourceImage: MenuSourceImage | null;
  createdAt: string;
}

export interface MenuSourceImage {
  bytes: Buffer;
  mimeType: 'image/jpeg' | 'image/png';
}

const menus = new Map<string, StoredMenu>();

export function createMenu(
  menu: MenuJson,
  servedFrom: 'live' | 'cache',
  dishAudio: (string | null)[],
  sourceImage: MenuSourceImage | null = null,
  id: string = randomUUID(),
): StoredMenu {
  const stored: StoredMenu = {
    id,
    menu,
    servedFrom,
    dishAudio,
    sourceImage,
    createdAt: new Date().toISOString(),
  };
  menus.set(stored.id, stored);
  return stored;
}

export function getMenu(id: string): StoredMenu | undefined {
  return menus.get(id);
}

export function resetMenus(): void {
  menus.clear();
}
