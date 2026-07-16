import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Dish } from "@shared/menu";
import { colors, fonts, radius, spacing, type } from "@/lib/theme";

interface MenuPointingGuideProps {
  dish: Dish;
  sourceUrl: string;
  compact?: boolean;
}

export function MenuPointingGuide({ dish, sourceUrl, compact = false }: MenuPointingGuideProps): React.ReactElement {
  const [aspectRatio, setAspectRatio] = useState(4 / 3);
  useEffect(() => {
    let active = true;
    Image.getSize(sourceUrl, (width, height) => {
      if (active && width > 0 && height > 0) setAspectRatio(width / height);
    });
    return () => { active = false; };
  }, [sourceUrl]);
  const highlight = useMemo<ViewStyle>(() => ({
    left: percent(dish.source_bbox.x_min),
    top: percent(dish.source_bbox.y_min),
    width: percent(dish.source_bbox.x_max - dish.source_bbox.x_min),
    height: percent(dish.source_bbox.y_max - dish.source_bbox.y_min),
  }), [dish.source_bbox]);
  return (
    <View style={[styles.guide, compact && styles.compactGuide]}>
      <View style={styles.copyRow}>
        <View style={styles.icon}><Ionicons name="hand-left-outline" size={17} color={colors.kopi} /></View>
        <View style={styles.copy}>
          <Text style={styles.label}>POINT TO THIS ON THE MENU</Text>
          {!compact ? <Text style={styles.hint}>Show the highlighted row to the stall.</Text> : null}
        </View>
      </View>
      <View style={[styles.board, { aspectRatio }]}>
        <Image accessibilityLabel="Scanned menu with selected dish highlighted" source={{ uri: sourceUrl }} style={styles.image} resizeMode="stretch" />
        <View pointerEvents="none" style={[styles.highlight, highlight]}>
          <View style={styles.pin}><Ionicons name="arrow-forward" size={13} color={colors.kopi} /></View>
        </View>
      </View>
    </View>
  );
}

function percent(value: number): `${number}%` {
  return `${Math.max(0, Math.min(100, value / 9.99))}%`;
}

const styles = StyleSheet.create({
  guide: { backgroundColor: colors.kayaTint, borderBottomWidth: 1, borderBottomColor: colors.mist },
  compactGuide: { borderRadius: radius.control, overflow: "hidden", borderWidth: 1, borderColor: colors.mist },
  copyRow: { flexDirection: "row", alignItems: "center", gap: spacing(2.5), paddingHorizontal: spacing(3), paddingVertical: spacing(2.5) },
  icon: { width: 34, height: 34, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.kaya },
  copy: { flex: 1 },
  label: { ...type.caption, color: colors.kopi, fontFamily: fonts.semibold, letterSpacing: 0.7 },
  hint: { ...type.caption, color: colors.pending, marginTop: 1 },
  board: { width: "100%", position: "relative", backgroundColor: colors.kopi, overflow: "hidden" },
  image: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  highlight: { position: "absolute", borderWidth: 3, borderColor: colors.kaya, backgroundColor: "rgba(242,185,75,0.28)", shadowColor: colors.kopi, shadowOpacity: 0.45, shadowRadius: 7, shadowOffset: { width: 0, height: 2 } },
  pin: { position: "absolute", left: -16, top: "50%", width: 28, height: 28, marginTop: -14, borderRadius: radius.pill, backgroundColor: colors.kaya, borderWidth: 2, borderColor: colors.white, alignItems: "center", justifyContent: "center" },
});
