import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import { z } from 'zod';
import type { ExtractedMedia } from './types';

const YtDlpInfoSchema = z
  .object({
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .passthrough();

export function captionFromYtDlpInfo(payload: unknown): string | null {
  const parsed = YtDlpInfoSchema.safeParse(payload);
  if (!parsed.success) return null;
  const description = cleanText(parsed.data.description);
  return description ?? cleanText(parsed.data.title);
}

export async function downloadTikTokWithYtDlp(url: string, outDir: string): Promise<ExtractedMedia> {
  mkdirSync(outDir, { recursive: true });
  const info = await readInfo(url);
  const videoPath = path.join(outDir, 'video.mp4');
  await execa('yt-dlp', ['--no-warnings', '-f', 'mp4', '-o', videoPath, url]);
  return {
    fixtureSlug: null,
    videoPath,
    audioPath: null,
    coverPath: null,
    caption: captionFromYtDlpInfo(info),
  };
}

async function readInfo(url: string): Promise<unknown> {
  const { stdout } = await execa('yt-dlp', [
    '--no-warnings',
    '--dump-single-json',
    '--skip-download',
    url,
  ]);
  return JSON.parse(stdout) as unknown;
}

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
