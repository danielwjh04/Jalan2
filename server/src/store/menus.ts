import { randomUUID } from 'node:crypto';
import type { MenuJson } from '@shared/menu';

export interface StoredMenu {
  id: string;
  menu: MenuJson;
  servedFrom: 'live' | 'cache';
  dishAudio: (string | null)[];
  createdAt: string;
}

const menus = new Map<string, StoredMenu>();

export function createMenu(
  menu: MenuJson,
  servedFrom: 'live' | 'cache',
  dishAudio: (string | null)[],
): StoredMenu {
  const stored: StoredMenu = {
    id: randomUUID(),
    menu,
    servedFrom,
    dishAudio,
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
