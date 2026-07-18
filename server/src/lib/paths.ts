import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rootCandidates = [process.cwd(), path.join(process.cwd(), 'server'), moduleRoot];
const serverRoot = rootCandidates.find((candidate) =>
  existsSync(path.join(candidate, 'fixtures', 'manifest.json')),
) ?? moduleRoot;
const dataRoot = process.env.K_SERVICE || process.env.FUNCTION_TARGET
  ? path.join('/tmp', 'jalan2')
  : path.join(serverRoot, 'data');

export function fixturesRoot(): string {
  return path.join(serverRoot, 'fixtures');
}

export function discoveriesRoot(): string {
  return path.join(serverRoot, 'discoveries');
}

export function downloadsRoot(): string {
  return path.join(dataRoot, 'downloads');
}

export function sourceCoversRoot(): string {
  return path.join(dataRoot, 'source-covers');
}

export function tripsDataRoot(): string {
  return path.join(dataRoot, 'trips');
}

export function runWorkDir(id: string): string {
  return path.join(dataRoot, 'runs', id);
}

export function voiceCacheDir(): string {
  return path.join(dataRoot, 'voice-cache');
}

export function voiceFixturesRoot(): string {
  return path.join(serverRoot, 'fixtures', 'voice');
}
