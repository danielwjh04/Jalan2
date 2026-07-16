import { existsSync, mkdirSync } from 'node:fs';
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
    // ffmpeg can exit successfully without writing a frame when a short or
    // variable-frame-rate social clip ends just before the requested seek.
    // Never pass a path that does not exist to the vision model.
    if (existsSync(framePath)) frames.push({ path: framePath, ts });
  }
  if (frames.length === 0) throw new Error(`Could not extract a frame from ${videoPath}`);
  return frames;
}

export async function extractAudio(videoPath: string, outDir: string): Promise<string> {
  mkdirSync(outDir, { recursive: true });
  const audioPath = path.join(outDir, 'audio.wav');
  await execa(ffmpegBin(), ['-y', '-i', videoPath, '-vn', '-ac', '1', '-ar', '16000', audioPath]);
  return audioPath;
}

export async function imageToJpeg(inputPath: string, outPath: string): Promise<void> {
  mkdirSync(path.dirname(outPath), { recursive: true });
  await execa(ffmpegBin(), ['-y', '-i', inputPath, '-frames:v', '1', '-q:v', '2', outPath]);
}

export async function imageToHeroJpeg(
  inputPath: string,
  outPath: string,
  focusX: number,
  focusY: number,
  zoom = 1,
): Promise<void> {
  mkdirSync(path.dirname(outPath), { recursive: true });
  const scaledWidth = Math.round(1280 * zoom);
  const scaledHeight = Math.round(720 * zoom);
  const x = `min(max(iw*${focusX}-ow/2,0),iw-ow)`;
  const y = `min(max(ih*${focusY}-oh/2,0),ih-oh)`;
  const filter = `scale=${scaledWidth}:${scaledHeight}:force_original_aspect_ratio=increase,crop=1280:720:x='${x}':y='${y}'`;
  await execa(ffmpegBin(), ['-y', '-i', inputPath, '-frames:v', '1', '-vf', filter, '-q:v', '2', outPath]);
}

export async function imagesToSlideshow(imagePaths: string[], outPath: string): Promise<void> {
  if (imagePaths.length === 0) throw new Error('No images provided for slideshow');
  const imageDir = path.dirname(imagePaths[0]);
  const sequential = imagePaths.every((imagePath, index) => {
    const expected = `image_${String(index + 1).padStart(2, '0')}.jpg`;
    return path.dirname(imagePath) === imageDir && path.basename(imagePath) === expected;
  });
  if (!sequential) throw new Error('Slideshow images must be sequential image_NN.jpg files');
  mkdirSync(path.dirname(outPath), { recursive: true });
  await execa(
    ffmpegBin(),
    [
      '-y',
      '-framerate', '1/2',
      '-i', 'image_%02d.jpg',
      '-vf', 'scale=720:-2',
      '-pix_fmt', 'yuv420p',
      outPath,
    ],
    { cwd: imageDir },
  );
}
