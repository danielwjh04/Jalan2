import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { MenuResponse } from "@shared/api";
import { SwipeDeck } from "@/components/SwipeDeck";
import { VoiceButton } from "@/components/VoiceButton";
import { getMenu, serverUrl } from "@/lib/api";
import {
  cardShadow,
  colors,
  eyebrow,
  fonts,
  radius,
  spacing,
  type,
} from "@/lib/theme";

export default function MenuScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<MenuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    getMenu(id)
      .then(setData)
      .catch((cause: Error) => setError(cause.message));
  }, [id]);

  if (!data) {
    return (
      <View style={styles.center}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ActivityIndicator color={colors.tide} />
        )}
      </View>
    );
  }

  const { menu, dishAudio, servedFrom } = data;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={eyebrow}>{menu.stall_name ?? "Menu scan"}</Text>
        {servedFrom === "cache" && (
          <Text style={styles.demoTag}>Demo menu</Text>
        )}
      </View>
      {!done && (
        <SwipeDeck
          dishes={menu.dishes}
          onLike={(index) => setLiked((prev) => [...prev, index])}
          onFinish={() => setDone(true)}
        />
      )}
      {(done || liked.length > 0) && (
        <View style={styles.shortlist}>
          <Text style={eyebrow}>Your shortlist</Text>
          {liked.length === 0 && (
            <Text style={styles.empty}>Nothing shortlisted yet.</Text>
          )}
          {liked.map((index) => {
            const dish = menu.dishes[index];
            const audio = dishAudio[index];
            return (
              <View key={`${dish.name_local}-${index}`} style={styles.item}>
                <Text style={styles.itemName}>{dish.name_local}</Text>
                <Text style={styles.itemPhrase}>Say: {dish.order_phrase}</Text>
                {audio ? (
                  <VoiceButton
                    key={audio}
                    audioUrl={serverUrl(audio)}
                    label="Play order phrase"
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing(4),
    gap: spacing(4),
    paddingBottom: spacing(10),
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(6),
  },
  error: { ...type.body, color: colors.danger },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  demoTag: {
    color: colors.pending,
    backgroundColor: colors.pendingSoft,
    fontFamily: fonts.medium,
    fontSize: 11,
    borderRadius: radius.pill,
    paddingVertical: spacing(0.5),
    paddingHorizontal: spacing(2),
    overflow: "hidden",
  },
  shortlist: { gap: spacing(3) },
  empty: { ...type.caption, color: colors.inkSoft },
  item: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing(3.5),
    gap: spacing(2),
    ...cardShadow,
  },
  itemName: { ...type.heading, color: colors.ink },
  itemPhrase: {
    ...type.label,
    color: colors.inkSoft,
    fontFamily: fonts.regular,
  },
});
