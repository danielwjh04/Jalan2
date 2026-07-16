import { stat } from 'node:fs/promises';
import { pickExtractor } from '../src/adapters/extractor';
import { loadConfig } from '../src/config';

const sources = [
  { platform: 'tiktok', url: 'https://vt.tiktok.com/ZSXM9APNJ/' },
  { platform: 'xhs', url: 'http://xhslink.com/o/7X5fbaGMuG9' },
];

const extractor = pickExtractor(loadConfig());
const checks = [];
for (const source of sources) {
  const started = Date.now();
  try {
    const media = await extractor.extract(source.url);
    const video = media.videoPath ? await stat(media.videoPath) : null;
    checks.push({
      platform: source.platform,
      status: 'live',
      durationMs: Date.now() - started,
      videoBytes: video?.size ?? 0,
      coverCandidates: media.coverCandidates.length,
      caption: Boolean(media.caption),
    });
  } catch (error) {
    checks.push({
      platform: source.platform,
      status: 'failed',
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message.slice(0, 180) : String(error),
    });
  }
}

const ok = checks.every((check) => check.status === 'live');
console.info(JSON.stringify({ ok, extractor: extractor.name, checks }, null, 2));
if (!ok) process.exitCode = 1;
