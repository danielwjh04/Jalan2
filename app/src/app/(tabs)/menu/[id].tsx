import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { MenuResponse } from "@shared/api";
import { BoboCard } from "@/components/BoboCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StateCard } from "@/components/StateCard";
import { SurfaceCard } from "@/components/SurfaceCard";
import { SwipeDeck } from "@/components/SwipeDeck";
import { VoiceButton } from "@/components/VoiceButton";
import { getMenu, serverUrl } from "@/lib/api";
import { colors, eyebrow, radius, spacing, type } from "@/lib/theme";

export default function MenuScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<MenuResponse | null>(null);
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
  useEffect(() => { void load(); }, [load]);
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
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View><Text style={styles.eyebrow}>KOPITIAM MODE</Text><Text style={styles.title}>{data.menu.stall_name ?? "Menu scan"}</Text></View>
        {data.servedFrom === "cache" ? <Text style={styles.demoTag}>Demo menu</Text> : null}
      </View>
      {!done ? <SwipeDeck dishes={data.menu.dishes} onLike={(index) => setLiked((items) => [...items, index])} onFinish={() => setDone(true)} /> : null}
      {done || liked.length > 0 ? <Shortlist data={data} liked={liked} /> : null}
    </ScrollView>
  );
}

function Shortlist({ data, liked }: { data: MenuResponse; liked: number[] }): React.ReactElement {
  return (
    <View style={styles.shortlist}>
      <BoboCard compact title="Ready to order?" message="Play the local phrase, give it a try, and point to the dish if the kopitiam is noisy." />
      <Text style={styles.eyebrow}>YOUR SHORTLIST</Text>
      {liked.length === 0 ? <Text style={styles.empty}>Nothing shortlisted yet.</Text> : null}
      {liked.map((index) => {
        const dish = data.menu.dishes[index];
        const audio = data.dishAudio[index];
        return (
          <SurfaceCard key={`${dish.name_local}-${index}`} style={styles.item}>
            <Text style={styles.itemName}>{dish.name_local}</Text>
            <Text style={styles.itemPhrase}>Say: {dish.order_phrase}</Text>
            {audio ? <VoiceButton key={audio} audioUrl={serverUrl(audio)} label="Play order phrase" /> : null}
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
  eyebrow: { ...eyebrow },
  title: { ...type.title, color: colors.ink, marginTop: spacing(1) },
  demoTag: { ...type.caption, color: colors.pending, backgroundColor: colors.pendingSoft, borderRadius: radius.pill, paddingVertical: spacing(1), paddingHorizontal: spacing(2.5), overflow: "hidden" },
  shortlist: { gap: spacing(3) },
  empty: { ...type.caption, color: colors.inkSoft },
  item: { gap: spacing(2) },
  itemName: { ...type.heading, color: colors.ink },
  itemPhrase: { ...type.label, color: colors.inkSoft },
});
