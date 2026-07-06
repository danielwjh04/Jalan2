import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Link, useFocusEffect } from 'expo-router';
import type { FixtureCard as FixtureCardData } from '@shared/api';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { FixtureCard } from '@/components/FixtureCard';
import { PasteBar } from '@/components/PasteBar';
import { getFixtures } from '@/lib/api';
import { ingestVideo } from '@/lib/ingest';
import { colors, eyebrow, radius, spacing } from '@/lib/theme';

export default function HomeScreen(): React.ReactElement {
  const [prefill, setPrefill] = useState('');
  const [busy, setBusy] = useState(false);
  const [fixtures, setFixtures] = useState<FixtureCardData[]>([]);

  useEffect(() => {
    getFixtures()
      .then(setFixtures)
      .catch(() => setFixtures([]));
  }, []);

  // Paste-on-focus: if the clipboard already holds a video link, offer it.
  useFocusEffect(
    useCallback(() => {
      void Clipboard.getStringAsync()
        .then((text) => {
          if (normalizeVideoUrl(text)) setPrefill(text);
        })
        .catch(() => undefined);
    }, []),
  );

  const submit = (raw: string): void => {
    setBusy(true);
    ingestVideo(raw)
      .catch((cause: unknown) => Alert.alert('Could not start', String(cause)))
      .finally(() => setBusy(false));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Visit Malaysia 2026 · Kuching</Text>
      <Text style={styles.tagline}>Saw it on TikTok?{'\n'}Book it for real.</Text>
      <PasteBar prefill={prefill} busy={busy} onSubmit={submit} />
      {fixtures.length > 0 && (
        <>
          <Text style={styles.section}>Demo videos</Text>
          {fixtures.map((fixture) => (
            <FixtureCard
              key={fixture.slug}
              fixture={fixture}
              disabled={busy}
              onPress={() => submit(fixture.url)}
            />
          ))}
        </>
      )}
      {__DEV__ && fixtures.length > 0 && (
        <Pressable
          style={styles.devButton}
          disabled={busy}
          onPress={() => submit(fixtures[0].url)}
        >
          <Text style={styles.devButtonText}>Simulate iOS share (dev)</Text>
        </Pressable>
      )}
      <Link href="/directory" style={styles.directoryLink}>
        Operator directory
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(5), gap: spacing(4), paddingBottom: spacing(10) },
  eyebrow: { ...eyebrow, marginTop: spacing(2) },
  tagline: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: spacing(1),
  },
  section: { ...eyebrow, marginTop: spacing(3) },
  devButton: {
    borderColor: colors.mist,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.control,
    padding: spacing(3),
    alignItems: 'center',
    marginTop: spacing(1),
  },
  devButtonText: { color: colors.inkSoft, fontSize: 13 },
  directoryLink: {
    color: colors.tide,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing(4),
    textAlign: 'center',
  },
});
