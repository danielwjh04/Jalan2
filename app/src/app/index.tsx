import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { FixtureCard as FixtureCardData } from '@shared/api';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { FixtureCard } from '@/components/FixtureCard';
import { BoboCard } from '@/components/BoboCard';
import { HomeHeader } from '@/components/HomeHeader';
import { PasteBar } from '@/components/PasteBar';
import { getFixtures } from '@/lib/api';
import { ingestVideo } from '@/lib/ingest';
import { scanMenu, type MenuSource } from '@/lib/menu';
import { cardShadow, colors, eyebrow, radius, spacing, type } from '@/lib/theme';

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
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
        <BoboCard
          tone="acid"
          title="Found something local?"
          message="Send me the post. I will pull out the place, price, operator and best photo."
        />
        <View style={styles.quickRow}>
          <Pressable style={styles.menuCard} disabled={busy} onPress={chooseMenuSource}>
            <Text style={styles.menuEyebrow}>MENU MODE</Text>
            <Text style={styles.menuTitle}>Scan a kopitiam menu</Text>
            <Text style={styles.menuArrow}>↗</Text>
          </Pressable>
          <Pressable style={styles.operatorCard} onPress={() => router.push('/directory')}>
            <Text style={styles.operatorEyebrow}>LOCAL SUPPLY</Text>
            <Text style={styles.operatorTitle}>Meet the operators</Text>
            <Text style={styles.operatorArrow}>→</Text>
          </Pressable>
        </View>
        {fixtures.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <View>
                <Text style={styles.section}>SOCIAL DISCOVERIES</Text>
                <Text style={styles.sectionTitle}>Popular near you</Text>
              </View>
              <View style={styles.livePill}><Text style={styles.liveText}>LIVE</Text></View>
            </View>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas },
  container: { paddingBottom: spacing(12) },
  pasteWrap: { paddingHorizontal: spacing(5), marginTop: spacing(1) },
  content: { padding: spacing(5), gap: spacing(5) },
  quickRow: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(1) },
  menuCard: {
    flex: 1,
    minHeight: 142,
    borderRadius: radius.card,
    padding: spacing(4),
    justifyContent: 'space-between',
    backgroundColor: colors.tide,
    ...cardShadow,
  },
  operatorCard: {
    flex: 1,
    minHeight: 142,
    borderRadius: radius.card,
    padding: spacing(4),
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.mist,
    ...cardShadow,
  },
  menuEyebrow: { ...eyebrow, color: 'rgba(5,5,5,0.58)' },
  operatorEyebrow: { ...eyebrow, color: colors.inkSoft },
  menuTitle: { ...type.heading, color: colors.black, maxWidth: 130 },
  operatorTitle: { ...type.heading, color: colors.ink, maxWidth: 130 },
  menuArrow: { color: colors.black, fontSize: 24 },
  operatorArrow: { color: colors.tide, fontSize: 24 },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing(2) },
  section: { ...eyebrow },
  sectionTitle: { ...type.title, color: colors.ink, marginTop: spacing(1) },
  livePill: { backgroundColor: colors.tideSoft, borderRadius: radius.pill, paddingHorizontal: spacing(3), paddingVertical: spacing(1.5) },
  liveText: { ...type.caption, color: colors.tide, fontFamily: 'DMSans_600SemiBold' },
  devButton: {
    borderColor: colors.mist,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.control,
    padding: spacing(3),
    alignItems: 'center',
    marginTop: spacing(1),
  },
  devButtonText: { ...type.caption, color: colors.inkSoft },
});
