import { mkdtempSync, writeFileSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import ffmpegPath from 'ffmpeg-static';
import { afterEach, describe, expect, it } from 'vitest';
import { imageToJpeg, imagesToSlideshow, videoDuration } from '../src/pipeline/keyframes';

const tinyJpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAVEAEBAAAAAAAAAAAAAAAAAAAAAf/aAAwDAQACEAMQAAABlA//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z',
  'base64',
);

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { force: true, recursive: true })));
  tempDirs.length = 0;
});

describe('imagesToSlideshow', () => {
  it('turns sequential images into a playable video', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'jalan2-slideshow-'));
    tempDirs.push(dir);
    const images = [1, 2].map((index) => path.join(dir, `image_${String(index).padStart(2, '0')}.jpg`));
    for (const image of images) writeFileSync(image, tinyJpeg);
    const outPath = path.join(dir, 'video.mp4');

    await imagesToSlideshow(images, outPath);

    await expect(readFile(outPath)).resolves.toHaveProperty('byteLength');
    await expect(videoDuration(outPath)).resolves.toBeGreaterThan(0);
  });
});

describe('imageToJpeg', () => {
  it('normalizes a WebP image to JPEG', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'jalan2-image-'));
    tempDirs.push(dir);
    const sourcePath = path.join(dir, 'source.jpg');
    const webpPath = path.join(dir, 'source.webp');
    const jpegPath = path.join(dir, 'image_01.jpg');
    writeFileSync(sourcePath, tinyJpeg);
    if (!ffmpegPath) throw new Error('ffmpeg-static did not resolve a binary for this platform');
    await execa(ffmpegPath, ['-y', '-i', sourcePath, webpPath]);

    await imageToJpeg(webpPath, jpegPath);

    const jpeg = await readFile(jpegPath);
    expect(jpeg.subarray(0, 2).toString('hex')).toBe('ffd8');
  });
});
