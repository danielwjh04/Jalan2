import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Link, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { FixtureCard as FixtureCardData } from '@shared/api';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { FixtureCard } from '@/components/FixtureCard';
import { GradientButton } from '@/components/GradientButton';
import { HomeHeader } from '@/components/HomeHeader';
import { PasteBar } from '@/components/PasteBar';
import { getFixtures } from '@/lib/api';
import { ingestVideo } from '@/lib/ingest';
import { scanMenu, type MenuSource } from '@/lib/menu';
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

  const startMenuScan = (source: MenuSource): void => {
    setBusy(true);
    scanMenu(source)
      .catch((cause: unknown) => Alert.alert('Could not read menu', String(cause)))
      .finally(() => setBusy(false));
  };

  const chooseMenuSource = (): void => {
    Alert.alert('Scan a kopitiam menu', 'Where is the menu photo?', [
      { text: 'Take photo', onPress: () => startMenuScan('camera') },
      { text: 'Pick from library', onPress: () => startMenuScan('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const regions = [...new Set(fixtures.map((f) => f.region).filter((r): r is string => !!r))];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="light" />
      <HomeHeader regions={regions} />
      <View style={styles.pasteWrap}>
        <PasteBar prefill={prefill} busy={busy} onSubmit={submit} />
      </View>
      <View style={styles.content}>
        <GradientButton label="Scan a kopitiam menu" busy={busy} onPress={chooseMenuSource} />
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas },
  container: { paddingBottom: spacing(10) },
  pasteWrap: { paddingHorizontal: spacing(5), marginTop: -spacing(7) },
  content: { padding: spacing(5), gap: spacing(4) },
  section: { ...eyebrow, marginTop: spacing(1) },
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
