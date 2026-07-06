import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function fixturesRoot(): string {
  return path.join(serverRoot, 'fixtures');
}

export function downloadsRoot(): string {
  return path.join(serverRoot, 'data', 'downloads');
}

export function runWorkDir(id: string): string {
  return path.join(serverRoot, 'data', 'runs', id);
}
