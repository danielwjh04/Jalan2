import { z } from 'zod';

const UrlListSchema = z.object({ url_list: z.array(z.string()) }).passthrough();
const MediaUrlSchema = z.union([z.string(), UrlListSchema]);
const ImageDataSchema = z
  .object({
    no_watermark_image_list: z.array(MediaUrlSchema).optional(),
    watermark_image_list: z.array(MediaUrlSchema).optional(),
  })
  .passthrough();
const HybridSchema = z
  .object({
    code: z.number(),
    data: z
      .object({
        type: z.string(),
        desc: z.string().nullable().optional(),
        video_data: z
          .object({
            nwm_video_url_HQ: z.string().optional(),
            nwm_video_url: MediaUrlSchema.optional(),
          })
          .passthrough()
          .optional(),
        image_data: ImageDataSchema.optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type HybridMedia =
  | { kind: 'video'; playUrl: string; caption: string | null }
  | { kind: 'image'; imageUrls: string[]; caption: string | null };

export function parseHybridMedia(payload: unknown): HybridMedia {
  const parsed = HybridSchema.safeParse(payload);
  if (!parsed.success) throw new Error('TikHub response did not match the hybrid schema');
  const caption = parsed.data.data.desc ?? null;
  if (parsed.data.data.type === 'video') {
    const video = parsed.data.data.video_data;
    const playUrl = video?.nwm_video_url_HQ ?? firstUrl(video?.nwm_video_url);
    if (playUrl) return { kind: 'video', playUrl, caption };
  }
  if (parsed.data.data.type === 'image') {
    const imageUrls = usableImageUrls(parsed.data.data.image_data);
    if (imageUrls.length > 0) return { kind: 'image', imageUrls, caption };
  }
  throw new Error('TikHub response did not include usable media');
}

function firstUrl(mediaUrl: z.infer<typeof MediaUrlSchema> | undefined): string | null {
  if (!mediaUrl) return null;
  if (typeof mediaUrl === 'string') return mediaUrl;
  return mediaUrl.url_list[0] ?? null;
}

function usableImageUrls(imageData: z.infer<typeof ImageDataSchema> | undefined): string[] {
  const noWatermark = collectImageUrls(imageData?.no_watermark_image_list);
  const processable = noWatermark.filter((url) => !isLikelyHeic(url));
  if (processable.length > 0) return processable;
  const watermarked = collectImageUrls(imageData?.watermark_image_list);
  return watermarked.length > 0 ? watermarked : noWatermark;
}

function collectImageUrls(items: z.infer<typeof MediaUrlSchema>[] | undefined): string[] {
  return (items ?? []).map(firstUrl).filter((url): url is string => Boolean(url));
}

function isLikelyHeic(url: string): boolean {
  return url.split('?')[0].toLowerCase().endsWith('.heic');
}
