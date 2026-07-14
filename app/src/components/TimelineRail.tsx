import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius } from "@/lib/theme";

export function TimelineRail({
  position,
  isLast,
}: {
  position: number | null;
  isLast: boolean;
}): React.ReactElement {
  const selected = position !== null;
  return (
    <View style={styles.rail}>
      <View style={[styles.marker, selected && styles.markerSelected]}>
        <Text style={[styles.markerText, selected && styles.markerTextSelected]}>
          {selected ? position + 1 : "+"}
        </Text>
      </View>
      {!isLast ? <View style={styles.line} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { width: 36, alignItems: "center" },
  marker: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.halo,
    borderWidth: 3,
    borderColor: colors.canvas,
  },
  markerSelected: { backgroundColor: colors.sage },
  markerText: { color: colors.sageDeep, fontFamily: fonts.semibold, fontSize: 13 },
  markerTextSelected: { color: colors.white },
  line: { width: 2, flex: 1, minHeight: 52, backgroundColor: colors.halo },
});
