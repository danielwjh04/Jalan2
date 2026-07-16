import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import type { PipelineStage } from '@shared/status';
import { isTransportStop, type TripPlan, type TripStop } from '@shared/trip';
import { BoboCard } from '@/components/BoboCard';
import { GradientButton } from '@/components/GradientButton';
import { PlaceImage } from '@/components/PlaceImage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SurfaceCard } from '@/components/SurfaceCard';
import { createSocialCollection } from '@/lib/api';
import { MAX_SOCIAL_SOURCES, parseSocialUrls, resolveSocialTrip, sourcePlatform } from '@/lib/socialPlanner';
import { colors, eyebrow, radius, spacing, type } from '@/lib/theme';

type SourceStatus = 'loading' | 'ready' | 'error';
interface SourceResult {
  url: string;
  status: SourceStatus;
  stage: PipelineStage;
  trip: TripPlan | null;
  selected: string[];
  error: string | null;
}

export default function SocialPlanScreen(): React.ReactElement {
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [title, setTitle] = useState('');
  const [sources, setSources] = useState<SourceResult[]>([]);
  const [reading, setReading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedCount = useMemo(() => sources.reduce((sum, source) => sum + source.selected.length, 0), [sources]);
  const readPosts = async (): Promise<void> => {
    const urls = parseSocialUrls(raw);
    if (urls.length === 0) {
      setError('Paste at least one public XHS or TikTok link.');
      return;
    }
    setError(null);
    setReading(true);
    setSources(urls.map((url) => ({ url, status: 'loading', stage: 'QUEUED', trip: null, selected: [], error: null })));
    let cursor = 0;
    const worker = async (): Promise<void> => {
      while (cursor < urls.length) {
        const index = cursor;
        cursor += 1;
        try {
          const trip = await resolveSocialTrip(urls[index], (stage) => patchSource(setSources, index, { stage }));
          const selected = trip.selected_stop_ids.filter((id) => {
            const stop = trip.stops.find((item) => item.id === id);
            return stop ? !isTransportStop(stop) : false;
          });
          patchSource(setSources, index, { status: 'ready', stage: 'READY', trip, selected });
        } catch (cause) {
          patchSource(setSources, index, { status: 'error', stage: 'ERROR', error: cause instanceof Error ? cause.message : String(cause) });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(2, urls.length) }, () => worker()));
    setReading(false);
  };
  const toggleStop = (sourceIndex: number, stopId: string): void => {
    setSources((items) => items.map((source, index) => index !== sourceIndex ? source : {
      ...source,
      selected: source.selected.includes(stopId) ? source.selected.filter((id) => id !== stopId) : [...source.selected, stopId],
    }));
  };
  const toggleSource = (sourceIndex: number): void => {
    setSources((items) => items.map((source, index) => {
      if (index !== sourceIndex || !source.trip) return source;
      const stopIds = physicalStops(source.trip).map(({ id }) => id);
      return { ...source, selected: source.selected.length === stopIds.length ? [] : stopIds };
    }));
  };
  const createPlan = async (): Promise<void> => {
    const selections = sources.flatMap((source) => source.trip && source.selected.length
      ? [{ tripId: source.trip.id, stopIds: source.selected }]
      : []);
    if (selectedCount < 2) {
      setError('Choose at least two places so Jalan2 can build a route.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const trip = await createSocialCollection({ title: title.trim() || undefined, selections });
      router.replace(`/trip/${trip.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setCreating(false);
    }
  };
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Build from social posts" eyebrowText="XHS + TIKTOK" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <BoboCard compact title="One trip, many posts" message="Paste up to eight posts. Pick the places you actually want, then I will group nearby stops, connect long transfers and check whether the plan is realistic." />
        <SurfaceCard style={styles.inputCard}>
          <Text style={styles.stepLabel}>1 · ADD SOURCES</Text>
          <Text style={styles.heading}>Paste one link per line</Text>
          <TextInput
            accessibilityLabel="XHS and TikTok links"
            multiline
            numberOfLines={6}
            placeholder={'https://xhslink.com/...\nhttps://vt.tiktok.com/...'}
            placeholderTextColor={colors.inkSoft}
            value={raw}
            onChangeText={setRaw}
            style={styles.urlInput}
          />
          <Text style={styles.hint}>Public links only · maximum {MAX_SOCIAL_SOURCES} · failed sources stay visible</Text>
          <GradientButton label={reading ? 'Reading posts…' : 'Read all posts'} busy={reading} disabled={reading} onPress={() => void readPosts()} />
        </SurfaceCard>
        {sources.length ? (
          <View style={styles.results}>
            <View style={styles.resultHeading}>
              <View><Text style={styles.stepLabel}>2 · CHOOSE PLACES</Text><Text style={styles.heading}>{selectedCount} places selected</Text></View>
              {reading ? <ActivityIndicator color={colors.sageDeep} /> : null}
            </View>
            {sources.map((source, index) => (
              <SourceCard key={`${source.url}-${index}`} source={source} onToggleSource={() => toggleSource(index)} onToggleStop={(id) => toggleStop(index, id)} />
            ))}
          </View>
        ) : null}
        {sources.some(({ status }) => status === 'ready') ? (
          <SurfaceCard style={styles.createCard}>
            <Text style={styles.stepLabel}>3 · BUILD THE ROUTE</Text>
            <Text style={styles.heading}>Name your itinerary</Text>
            <TextInput accessibilityLabel="Itinerary name" placeholder="My Malaysia food and culture trip" placeholderTextColor={colors.inkSoft} value={title} onChangeText={setTitle} style={styles.titleInput} />
            <Text style={styles.hint}>Jalan2 will optimize the first route. On the next screen you can drag stops into your own order and switch each leg between walking, transit, drive and Grab.</Text>
            <GradientButton label={`Build itinerary with ${selectedCount} places`} busy={creating} disabled={reading || selectedCount < 2} onPress={() => void createPlan()} />
          </SurfaceCard>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </View>
  );
}

function SourceCard(props: { source: SourceResult; onToggleSource: () => void; onToggleStop: (id: string) => void }): React.ReactElement {
  const { source } = props;
  if (source.status === 'loading') return (
    <SurfaceCard style={styles.sourceCard}><View style={styles.sourceHeader}><PlatformPill url={source.url} /><ActivityIndicator color={colors.sageDeep} /></View><Text style={styles.sourceTitle}>{stageLabel(source.stage)}</Text><Text numberOfLines={1} style={styles.sourceUrl}>{source.url}</Text></SurfaceCard>
  );
  if (source.status === 'error' || !source.trip) return (
    <SurfaceCard style={[styles.sourceCard, styles.errorCard]}><View style={styles.sourceHeader}><PlatformPill url={source.url} /><Ionicons name="alert-circle" size={21} color={colors.danger} /></View><Text style={styles.sourceTitle}>Could not read this post</Text><Text style={styles.error}>{source.error}</Text><Text numberOfLines={1} style={styles.sourceUrl}>{source.url}</Text></SurfaceCard>
  );
  const stops = physicalStops(source.trip);
  const allSelected = source.selected.length === stops.length;
  return (
    <SurfaceCard style={styles.sourceCard}>
      <View style={styles.sourceHeader}>
        <View style={styles.sourceCopy}><PlatformPill url={source.url} /><Text style={styles.sourceTitle}>{source.trip.title}</Text><Text style={styles.sourceMeta}>{source.trip.region} · {stops.length} places</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${allSelected ? 'Deselect' : 'Select'} all places from ${source.trip.title}`} style={[styles.selectAll, allSelected && styles.selectedButton]} onPress={props.onToggleSource}><Ionicons name={allSelected ? 'checkmark' : 'add'} size={17} color={allSelected ? colors.white : colors.sageDeep} /><Text style={[styles.selectAllText, allSelected && styles.selectedButtonText]}>{allSelected ? 'All added' : 'Add all'}</Text></Pressable>
      </View>
      <View style={styles.stopGrid}>{stops.map((stop) => <SelectableStop key={stop.id} stop={stop} selected={source.selected.includes(stop.id)} onPress={() => props.onToggleStop(stop.id)} />)}</View>
    </SurfaceCard>
  );
}

function SelectableStop({ stop, selected, onPress }: { stop: TripStop; selected: boolean; onPress: () => void }): React.ReactElement {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} style={[styles.stop, selected && styles.stopSelected]} onPress={onPress}>
      <PlaceImage placeId={stop.place_id} placePhotoAvailable={stop.place_photo_available} fallbackUrl={stop.image_url} placeAttributions={stop.place_photo_attributions} fallbackAttributions={stop.image_attributions} style={styles.stopImage} />
      <View style={styles.stopCopy}><Text numberOfLines={2} style={styles.stopName}>{stop.name}</Text><Text numberOfLines={2} style={styles.stopSummary}>{stop.summary}</Text></View>
      <View style={[styles.check, selected && styles.checkSelected]}><Ionicons name={selected ? 'checkmark' : 'add'} size={16} color={selected ? colors.white : colors.sageDeep} /></View>
    </Pressable>
  );
}

function PlatformPill({ url }: { url: string }): React.ReactElement {
  return <View style={styles.platform}><Text style={styles.platformText}>{sourcePlatform(url)}</Text></View>;
}

function physicalStops(trip: TripPlan): TripStop[] {
  return trip.stops.filter((stop) => !isTransportStop(stop));
}

function stageLabel(stage: PipelineStage): string {
  const labels: Partial<Record<PipelineStage, string>> = { QUEUED: 'Queued', EXTRACTING: 'Loading creator media', TRANSCRIBING: 'Listening to the post', READING_FRAMES: 'Reading names and signs', FUSING: 'Grounding the places' };
  return labels[stage] ?? 'Building the source itinerary';
}

function patchSource(setter: React.Dispatch<React.SetStateAction<SourceResult[]>>, index: number, patch: Partial<SourceResult>): void {
  setter((items) => items.map((source, position) => position === index ? { ...source, ...patch } : source));
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { width: '100%', maxWidth: 1040, boxSizing: 'border-box', alignSelf: 'center', paddingHorizontal: spacing(5), paddingBottom: spacing(32), gap: spacing(4) },
  inputCard: { gap: spacing(3) },
  stepLabel: { ...eyebrow },
  heading: { ...type.title, color: colors.ink },
  urlInput: { ...type.body, minHeight: 132, textAlignVertical: 'top', backgroundColor: colors.canvas, borderRadius: radius.control, padding: spacing(3), color: colors.ink, borderWidth: 1, borderColor: colors.mist },
  titleInput: { ...type.body, minHeight: 50, backgroundColor: colors.canvas, borderRadius: radius.control, paddingHorizontal: spacing(3), color: colors.ink, borderWidth: 1, borderColor: colors.mist },
  hint: { ...type.caption, color: colors.inkSoft },
  results: { gap: spacing(3) },
  resultHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourceCard: { gap: spacing(3) },
  errorCard: { borderColor: colors.dangerSoft },
  sourceHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing(3) },
  sourceCopy: { flex: 1, gap: spacing(1) },
  sourceTitle: { ...type.heading, color: colors.ink },
  sourceMeta: { ...type.caption, color: colors.inkSoft },
  sourceUrl: { ...type.caption, color: colors.inkSoft },
  platform: { alignSelf: 'flex-start', borderRadius: radius.pill, backgroundColor: colors.halo, paddingHorizontal: spacing(2), paddingVertical: spacing(1) },
  platformText: { ...type.caption, color: colors.sageDeep },
  selectAll: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), minHeight: 42, paddingHorizontal: spacing(3), borderRadius: radius.pill, backgroundColor: colors.halo },
  selectAllText: { ...type.label, color: colors.sageDeep },
  selectedButton: { backgroundColor: colors.sageDeep },
  selectedButtonText: { color: colors.white },
  stopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  stop: { width: 214, minWidth: 0, position: 'relative', overflow: 'hidden', borderRadius: radius.control, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.mist, shadowColor: '#2F3F40', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  stopSelected: { borderColor: colors.sageDeep, borderWidth: 2 },
  stopImage: { width: '100%', height: 112 },
  stopCopy: { padding: spacing(2.5), gap: spacing(1) },
  stopName: { ...type.label, color: colors.ink },
  stopSummary: { ...type.caption, color: colors.inkSoft },
  check: { position: 'absolute', top: spacing(2), right: spacing(2), width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.card },
  checkSelected: { backgroundColor: colors.sageDeep },
  createCard: { gap: spacing(3) },
  error: { ...type.caption, color: colors.danger },
});
