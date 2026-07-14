import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { FixtureCard as FixtureCardData } from '@shared/api';
import { normalizeVideoUrl } from '@shared/videoUrl';
import { FixtureCard } from '@/components/FixtureCard';
import { BoboCard } from '@/components/BoboCard';
import { HomeHeader } from '@/components/HomeHeader';
import { PasteBar } from '@/components/PasteBar';
import { getFixtures } from '@/lib/api';
import { ingestVideo } from '@/lib/ingest';
import { scanMenu, type MenuSource } from '@/lib/menu';
import { cardShadow, colors, eyebrow, hairline, radius, spacing, type } from '@/lib/theme';

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
      <StatusBar style="dark" />
      <HomeHeader regions={regions} />
      <View style={styles.content}>
        <BoboCard
          hero
          eyebrow="BOBO SAYS SELAMAT DATANG"
          title="Where shall we jalan today?"
          message="Paste a Malaysian adventure video and I will shape it into a real day out."
        />
        <PasteBar prefill={prefill} busy={busy} onSubmit={submit} />
        <View style={styles.quickCard}>
          <Pressable style={styles.quickRow} disabled={busy} onPress={chooseMenuSource}>
            <View style={[styles.quickIcon, styles.quickIconKaya]}>
              <Ionicons name="restaurant-outline" size={19} color={colors.kopi} />
            </View>
            <View style={styles.quickCopy}>
              <Text style={styles.quickTitle}>Scan a kopitiam menu</Text>
              <Text style={styles.quickSub}>Dishes, prices and how to order</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
          </Pressable>
          <View style={styles.quickDivider} />
          <Pressable style={styles.quickRow} onPress={() => router.push('/directory')}>
            <View style={[styles.quickIcon, styles.quickIconSage]}>
              <Ionicons name="people-outline" size={19} color={colors.sageDeep} />
            </View>
            <View style={styles.quickCopy}>
              <Text style={styles.quickTitle}>Meet the local operators</Text>
              <Text style={styles.quickSub}>The people behind the trips</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
          </Pressable>
        </View>
        {fixtures.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <View>
                <Text style={styles.section}>SOCIAL DISCOVERIES</Text>
                <Text style={styles.sectionTitle}>Discover Malaysia</Text>
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
  container: { paddingBottom: spacing(30) },
  content: { paddingHorizontal: spacing(5), gap: spacing(4) },
  quickCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    ...hairline,
    ...cardShadow,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
  },
  quickDivider: { height: 1, backgroundColor: colors.mist, marginLeft: spacing(13) },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconKaya: { backgroundColor: colors.kayaTint },
  quickIconSage: { backgroundColor: colors.halo },
  quickCopy: { flex: 1, gap: 1 },
  quickTitle: { ...type.label, color: colors.ink, fontSize: 14 },
  quickSub: { ...type.caption, color: colors.inkSoft },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing(2),
  },
  section: { ...eyebrow },
  sectionTitle: { ...type.title, color: colors.ink, marginTop: spacing(1) },
  livePill: {
    backgroundColor: colors.confirmSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  liveText: { ...type.caption, color: colors.confirm, fontFamily: 'DMSans_600SemiBold' },
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
