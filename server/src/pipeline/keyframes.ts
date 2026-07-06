import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import ffmpegPath from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';

export interface Keyframe {
  path: string;
  ts: number;
}

function ffmpegBin(): string {
  if (!ffmpegPath) throw new Error('ffmpeg-static did not resolve a binary for this platform');
  return ffmpegPath;
}

export async function videoDuration(videoPath: string): Promise<number> {
  const { stdout } = await execa(ffprobe.path, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    videoPath,
  ]);
  const duration = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read duration of ${videoPath}`);
  }
  return duration;
}

export async function extractKeyframes(
  videoPath: string,
  outDir: string,
  count: number,
): Promise<Keyframe[]> {
  mkdirSync(outDir, { recursive: true });
  const duration = await videoDuration(videoPath);
  const frames: Keyframe[] = [];
  for (let i = 0; i < count; i += 1) {
    const ts = ((i + 0.5) * duration) / count;
    const framePath = path.join(outDir, `frame_${String(i + 1).padStart(2, '0')}.jpg`);
    await execa(ffmpegBin(), [
      '-y',
      '-ss', ts.toFixed(2),
      '-i', videoPath,
      '-frames:v', '1',
      '-vf', "scale=w='min(768,iw)':h=-2",
      framePath,
    ]);
    frames.push({ path: framePath, ts });
  }
  return frames;
}

export async function extractAudio(videoPath: string, outDir: string): Promise<string> {
  mkdirSync(outDir, { recursive: true });
  const audioPath = path.join(outDir, 'audio.wav');
  await execa(ffmpegBin(), ['-y', '-i', videoPath, '-vn', '-ac', '1', '-ar', '16000', audioPath]);
  return audioPath;
}
