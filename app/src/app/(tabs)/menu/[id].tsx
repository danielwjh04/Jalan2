import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { MenuResponse } from "@shared/api";
import { BoboCard } from "@/components/BoboCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StateCard } from "@/components/StateCard";
import { SurfaceCard } from "@/components/SurfaceCard";
import { SwipeDeck } from "@/components/SwipeDeck";
import { MenuPointingGuide } from "@/components/MenuPointingGuide";
import { MenuOrderSpeaker } from "@/components/MenuOrderSpeaker";
import { getMenu, serverUrl } from "@/lib/api";
import { cachedMenuResponse } from "@/lib/menuScanSession";
import { colors, eyebrow, radius, spacing, type } from "@/lib/theme";

export default function MenuScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<MenuResponse | null>(() => id ? cachedMenuResponse(id) : null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (): Promise<void> => {
    if (!id) return;
    try {
      setData(await getMenu(id));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load menu");
    }
  }, [id]);
  useEffect(() => { if (!data) void load(); }, [data, load]);
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Menu guide" onBack={() => router.back()} />
      {!data ? (
        <View style={styles.center}>
          {error ? <StateCard title="Menu could not load" message={error} actionLabel="Retry" onAction={() => void load()} /> : <ActivityIndicator color={colors.sage} />}
        </View>
      ) : <MenuContent data={data} />}
    </View>
  );
}

function MenuContent({ data }: { data: MenuResponse }): React.ReactElement {
  const [liked, setLiked] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const sourceMenuUrl = data.sourceImageUrl ? serverUrl(data.sourceImageUrl) : undefined;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>KOPITIAM MODE</Text><Text style={styles.title}>{data.menu.stall_name ?? "Menu scan"}</Text><Text style={styles.subtitle}>Swipe through the board and save what sounds delicious.</Text></View>
        {data.servedFrom === "cache" ? <Text style={styles.demoTag}>Demo menu</Text> : null}
      </View>
      {sourceMenuUrl ? <SourcePhoto url={sourceMenuUrl} count={data.menu.dishes.length} /> : null}
      {!done ? <SwipeDeck dishes={data.menu.dishes} sourceMenuUrl={sourceMenuUrl} onLike={(index) => setLiked((items) => [...items, index])} onFinish={() => setDone(true)} /> : null}
      {done || liked.length > 0 ? <Shortlist data={data} liked={liked} /> : null}
    </ScrollView>
  );
}

function SourcePhoto({ url, count }: { url: string; count: number }): React.ReactElement {
  return (
    <View style={styles.sourceCard}>
      <View style={styles.sourceCopy}><Text style={styles.sourceLabel}>SCANNED MENU</Text><Text style={styles.sourceHint}>{count} visible dishes found. Swipe through the full board.</Text></View>
      <Image resizeMode="contain" source={{ uri: url }} style={styles.sourceImage} />
    </View>
  );
}

function Shortlist({ data, liked }: { data: MenuResponse; liked: number[] }): React.ReactElement {
  const sourceMenuUrl = data.sourceImageUrl ? serverUrl(data.sourceImageUrl) : undefined;
  return (
    <View style={styles.shortlist}>
      <BoboCard compact title="Ready to order?" message="Play the local phrase, give it a try, and point to the dish if the kopitiam is noisy." />
      <Text style={styles.eyebrow}>YOUR SHORTLIST</Text>
      {liked.length === 0 ? <Text style={styles.empty}>Nothing shortlisted yet.</Text> : null}
      {liked.map((index) => {
        const dish = data.menu.dishes[index];
        return (
          <SurfaceCard key={`${dish.name_local}-${index}`} style={styles.item}>
            {sourceMenuUrl ? <MenuPointingGuide dish={dish} sourceUrl={sourceMenuUrl} compact /> : null}
            <Text style={styles.itemName}>{dish.name_local}</Text>
            <MenuOrderSpeaker menuId={data.id} dishIndex={index} dish={dish} />
          </SurfaceCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  container: { paddingHorizontal: spacing(5), gap: spacing(4), paddingBottom: spacing(34) },
  center: { flex: 1, justifyContent: "center", padding: spacing(5) },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing(3) },
  headerCopy: { flex: 1 },
  eyebrow: { ...eyebrow },
  title: { ...type.title, color: colors.ink, marginTop: spacing(1) },
  subtitle: { ...type.caption, color: colors.inkSoft, marginTop: spacing(1) },
  demoTag: { ...type.caption, color: colors.pending, backgroundColor: colors.pendingSoft, borderRadius: radius.pill, paddingVertical: spacing(1), paddingHorizontal: spacing(2.5), overflow: "hidden" },
  sourceCard: { backgroundColor: colors.kayaTint, borderRadius: radius.card, overflow: "hidden" },
  sourceCopy: { paddingHorizontal: spacing(4), paddingTop: spacing(3), gap: spacing(1) },
  sourceLabel: { ...eyebrow, color: colors.kopi },
  sourceHint: { ...type.caption, color: colors.kopi },
  sourceImage: { width: "100%", height: 170 },
  shortlist: { gap: spacing(3) },
  empty: { ...type.caption, color: colors.inkSoft },
  item: { gap: spacing(2) },
  itemName: { ...type.heading, color: colors.ink },
  itemPhrase: { ...type.label, color: colors.inkSoft },
});
