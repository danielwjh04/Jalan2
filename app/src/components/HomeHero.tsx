import { Image, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import boboImage from "../../assets/images/bobo.png";
import { cardShadow, colors, fonts, hairline, radius, spacing, type } from "@/lib/theme";

export function HomeHero(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 480;
  return (
    <View style={[styles.outer, { paddingTop: insets.top + spacing(2) }]}>
      <View style={[styles.hero, compact && styles.compactHero]}>
        <View style={[styles.stage, compact && styles.compactStage]}>
          <View style={[styles.halo, compact && styles.compactHalo]} />
          <View style={[styles.groundShadow, compact && styles.compactShadow]} />
          <Image accessibilityLabel="Bobo, Jalan2's waving Malayan tapir guide" resizeMode="contain" source={boboImage} style={[styles.bobo, compact && styles.compactBobo]} />
        </View>
        <View style={[styles.copyPanel, compact && styles.compactCopy]}>
          <Text style={[styles.wordmark, compact && styles.compactWordmark]}>Jalan2</Text>
          <Text style={[styles.slogan, compact && styles.compactSlogan]}>Turn travel finds into guides you can actually use.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { width: "100%", maxWidth: 1220, alignSelf: "center", paddingHorizontal: spacing(5), paddingBottom: spacing(4) },
  hero: { minHeight: 300, flexDirection: "row", alignItems: "center", overflow: "visible" },
  compactHero: { minHeight: 230 },
  stage: { width: 320, height: 300, zIndex: 2, position: "relative" },
  compactStage: { width: 150, height: 226 },
  halo: { position: "absolute", width: 238, height: 238, left: 22, top: 34, borderRadius: radius.pill, backgroundColor: colors.halo },
  compactHalo: { width: 142, height: 142, left: -4, top: 43 },
  groundShadow: { position: "absolute", left: 45, bottom: 12, width: 190, height: 24, borderRadius: radius.pill, backgroundColor: "rgba(18,28,24,0.16)", transform: [{ scaleX: 1.15 }] },
  compactShadow: { left: 5, bottom: 15, width: 120, height: 17 },
  bobo: { position: "absolute", left: 20, bottom: -2, width: 235, height: 320, zIndex: 2 },
  compactBobo: { left: -10, bottom: 0, width: 150, height: 225 },
  copyPanel: { flex: 1, minHeight: 226, justifyContent: "center", marginLeft: -spacing(10), paddingVertical: spacing(6), paddingLeft: spacing(16), paddingRight: spacing(8), borderRadius: radius.card, backgroundColor: colors.card, ...hairline, ...cardShadow },
  compactCopy: { minHeight: 184, marginLeft: -spacing(6), paddingLeft: spacing(8), paddingRight: spacing(4), paddingVertical: spacing(4) },
  wordmark: { color: colors.ink, fontFamily: fonts.display, fontSize: 50, lineHeight: 56, letterSpacing: -1.5 },
  compactWordmark: { fontSize: 35, lineHeight: 40, letterSpacing: -1 },
  slogan: { ...type.heading, maxWidth: 430, color: colors.inkSoft, marginTop: spacing(2) },
  compactSlogan: { ...type.body, maxWidth: 205, color: colors.inkSoft },
});
