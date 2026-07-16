import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Dish } from "@shared/menu";
import { mediaUrl } from "@/lib/api";
import { cardShadow, colors, fonts, radius, spacing, type } from "@/lib/theme";
import { ImageAttribution } from "./ImageAttribution";
import { MenuPointingGuide } from "./MenuPointingGuide";

export function DishCard({ dish, sourceMenuUrl }: { dish: Dish; sourceMenuUrl?: string }): React.ReactElement {
  const imageUrl = mediaUrl(dish.image_url);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [imageUrl]);
  return (
    <View style={styles.card}>
      {sourceMenuUrl ? <MenuPointingGuide dish={dish} sourceUrl={sourceMenuUrl} /> : null}
      <View style={styles.imageWrap}>
        {imageUrl && !imageFailed
          ? <Image source={{ uri: imageUrl }} style={styles.image} onError={() => setImageFailed(true)} />
          : <Placeholder dish={dish} />}
        <LinearGradient colors={["transparent", "rgba(18,28,24,0.88)"]} style={styles.scrim} />
        <Text style={styles.price}>{dish.price_myr === null ? "Price not shown" : `RM${dish.price_myr.toFixed(2)}`}</Text>
        <View style={styles.imageCopy}>
          <Text style={styles.name}>{dish.name_local}</Text>
          <Text style={styles.english}>{dish.name_english}</Text>
        </View>
        <ImageAttribution items={dish.image_attributions} />
      </View>
      <View style={styles.body}>
        <View style={styles.labelRow}>
          <Text style={styles.eyebrow}>HOW IT USUALLY TASTES</Text>
          <SpicePill level={dish.spice_level} />
        </View>
        <Text style={styles.taste}>{dish.taste_profile}</Text>
        <View style={styles.textureRow}>
          <Ionicons name="restaurant-outline" size={16} color={colors.sageDeep} />
          <Text style={styles.texture}>{dish.texture_profile}</Text>
        </View>
        {dish.allergens.length > 0 ? <AllergenRow allergens={dish.allergens} /> : null}
        {dish.reading_confidence !== "high" ? <ConfidenceNote level={dish.reading_confidence} /> : null}
        <Text style={styles.caption}>
          {imageUrl && !imageFailed
            ? "Illustrative photo checked against the dish family; stall recipes still vary. "
            : "No reliable matching photo was found. "}
          Taste and allergens are typical-recipe guidance. Check with the stall.
        </Text>
      </View>
    </View>
  );
}

function ConfidenceNote({ level }: { level: Dish["reading_confidence"] }): React.ReactElement {
  const label = level === "low" ? "AI read is uncertain" : "AI read: check the board";
  return (
    <View style={styles.confidenceRow}>
      <Ionicons name="scan-outline" size={15} color={colors.pending} />
      <Text style={styles.confidence}>{label}</Text>
    </View>
  );
}

function Placeholder({ dish }: { dish: Dish }): React.ReactElement {
  return (
    <View style={[styles.image, styles.placeholder]}>
      <Text style={styles.placeholderText}>{dish.name_local.slice(0, 1)}</Text>
      <Text style={styles.placeholderCaption}>Dish photo unavailable</Text>
    </View>
  );
}

function SpicePill({ level }: { level: Dish["spice_level"] }): React.ReactElement {
  const label = {
    none: "Not usually spicy",
    mild: "Mild heat",
    medium: "Medium heat",
    hot: "Hot",
    unknown: "Ask about spice",
  }[level];
  return <Text style={[styles.spice, level === "hot" && styles.hot]}>{label}</Text>;
}

function AllergenRow({ allergens }: { allergens: string[] }): React.ReactElement {
  return (
    <View style={styles.allergenRow}>
      {allergens.map((allergen) => <Text key={allergen} style={styles.allergen}>{allergen}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, overflow: "hidden", ...cardShadow },
  imageWrap: { height: 300, position: "relative" },
  image: { width: "100%", height: "100%" },
  scrim: { ...StyleSheet.absoluteFillObject },
  imageCopy: { position: "absolute", left: spacing(4), right: spacing(12), bottom: spacing(4), gap: spacing(1) },
  name: { ...type.display, color: colors.white, fontSize: 29, lineHeight: 34 },
  english: { ...type.body, color: "rgba(255,255,255,0.88)" },
  price: { position: "absolute", top: spacing(3), right: spacing(3), ...type.label, color: colors.kopi, backgroundColor: colors.kaya, borderRadius: radius.pill, paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), overflow: "hidden" },
  placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.halo },
  placeholderText: { color: colors.sage, fontFamily: fonts.semibold, fontSize: 64 },
  placeholderCaption: { ...type.caption, color: colors.inkSoft, marginTop: spacing(1) },
  body: { padding: spacing(4), gap: spacing(2.5) },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing(2) },
  eyebrow: { ...type.caption, color: colors.sageDeep, fontFamily: fonts.semibold, letterSpacing: 0.8 },
  taste: { ...type.heading, color: colors.ink },
  textureRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing(2) },
  texture: { ...type.body, color: colors.inkSoft, flex: 1 },
  spice: { ...type.caption, textTransform: "capitalize", color: colors.pending, backgroundColor: colors.pendingSoft, borderRadius: radius.pill, paddingHorizontal: spacing(2.5), paddingVertical: spacing(1), overflow: "hidden" },
  hot: { color: colors.danger, backgroundColor: colors.dangerSoft },
  allergenRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5) },
  allergen: { color: colors.pending, backgroundColor: colors.pendingSoft, fontFamily: fonts.medium, fontSize: 11, borderRadius: radius.pill, paddingVertical: spacing(0.75), paddingHorizontal: spacing(2), overflow: "hidden" },
  caption: { ...type.caption, color: colors.inkSoft },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  confidence: { ...type.caption, color: colors.pending },
});
