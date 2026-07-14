import { StyleSheet, Text, View } from "react-native";
import type { BookingView } from "@/lib/bookingPresentation";
import { colors, fonts, spacing, type } from "@/lib/theme";

const STEPS = ["Draft", "Waiting", "Confirmed"] as const;

export function BookingProgress({ view }: { view: BookingView }): React.ReactElement {
  const active = view === "confirmed" ? 2 : view === "waiting" ? 1 : 0;
  return (
    <View style={styles.row}>
      {STEPS.map((label, index) => (
        <View key={label} style={styles.step}>
          <View style={[styles.dot, index <= active && styles.dotActive]}>
            <Text style={[styles.number, index <= active && styles.numberActive]}>{index + 1}</Text>
          </View>
          <Text style={[styles.label, index === active && styles.labelActive]}>{label}</Text>
          {index < STEPS.length - 1 ? <View style={[styles.line, index < active && styles.lineActive]} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: spacing(1) },
  step: { flex: 1, alignItems: "center", gap: spacing(1), position: "relative" },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.mist, alignItems: "center", justifyContent: "center", zIndex: 1 },
  dotActive: { backgroundColor: colors.sage },
  number: { color: colors.inkSoft, fontFamily: fonts.medium, fontSize: 12 },
  numberActive: { color: colors.white },
  label: { ...type.caption, color: colors.inkSoft },
  labelActive: { color: colors.sageDeep, fontFamily: fonts.medium },
  line: { position: "absolute", height: 2, backgroundColor: colors.mist, left: "65%", right: "-35%", top: 13 },
  lineActive: { backgroundColor: colors.sage },
});
