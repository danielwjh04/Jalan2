import { router } from 'expo-router';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { ingest } from './api';

// The one handler. The paste bar, the demo shortcuts, the dev share
// simulator, and the native share intent all converge here; nothing
// downstream knows how the URL arrived.
export async function ingestVideo(raw: string): Promise<void> {
  const normalized = normalizeVideoUrl(raw);
  if (!normalized) throw new Error('That does not look like a video link');
  const { id } = await ingest(normalized.url);
  router.push(`/itinerary/${id}`);
}
