import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Link, useFocusEffect } from 'expo-router';
import type { FixtureRef } from '@shared/api';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { PasteBar } from '@/components/PasteBar';
import { getFixtures } from '@/lib/api';
import { ingestVideo } from '@/lib/ingest';
import { colors, radius, spacing } from '@/lib/theme';

export default function HomeScreen(): React.ReactElement {
  const [prefill, setPrefill] = useState('');
  const [busy, setBusy] = useState(false);
  const [fixtures, setFixtures] = useState<FixtureRef[]>([]);

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
      <Text style={styles.tagline}>
        Saw an adventure on TikTok or XHS? Paste the link and book it for real.
      </Text>
      <PasteBar prefill={prefill} busy={busy} onSubmit={submit} />
      {fixtures.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Demo videos</Text>
          {fixtures.map((fixture) => (
            <Pressable
              key={fixture.slug}
              style={styles.shortcut}
              disabled={busy}
              onPress={() => submit(fixture.url)}
            >
              <Text style={styles.shortcutText}>{fixture.slug}</Text>
              <Text style={styles.shortcutUrl} numberOfLines={1}>
                {fixture.url}
              </Text>
            </Pressable>
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
  container: { padding: spacing(4), gap: spacing(3) },
  tagline: { color: colors.text, fontSize: 24, fontWeight: '800', marginVertical: spacing(4) },
  sectionTitle: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: spacing(4),
    textTransform: 'uppercase',
  },
  shortcut: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    padding: spacing(3),
    gap: spacing(1),
  },
  shortcutText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  shortcutUrl: { color: colors.textDim, fontSize: 12 },
  devButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.control,
    padding: spacing(3),
    alignItems: 'center',
    marginTop: spacing(2),
  },
  devButtonText: { color: colors.textDim, fontSize: 13 },
  directoryLink: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
    marginTop: spacing(6),
    textAlign: 'center',
  },
});
