import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius } from "@/lib/theme";

type RailVariant = "place" | "origin" | "transport" | "add" | "dot";

interface Props {
  variant: RailVariant;
  position?: number;
  isLast?: boolean;
}

export function TimelineRail({ variant, position, isLast = false }: Props): React.ReactElement {
  const centered = variant === "transport" || variant === "dot";
  const dashed = variant === "dot";
  return (
    <View style={styles.rail}>
      {centered ? <View style={[styles.line, dashed && styles.dashed]} /> : null}
      <Marker variant={variant} position={position} />
      {!isLast ? <View style={[styles.line, dashed && styles.dashed]} /> : null}
    </View>
  );
}

function Marker({ variant, position }: { variant: RailVariant; position?: number }): React.ReactElement {
  if (variant === "dot") return <View style={styles.dot} />;
  if (variant === "transport") {
    return (
      <View style={[styles.marker, styles.markerFill]}>
        <Ionicons name="bus" size={16} color={colors.white} />
      </View>
    );
  }
  if (variant === "origin") {
    return (
      <View style={styles.marker}>
        <Ionicons name="location" size={15} color={colors.sageDeep} />
      </View>
    );
  }
  if (variant === "add") {
    return (
      <View style={styles.marker}>
        <Text style={styles.markerText}>+</Text>
      </View>
    );
  }
  return (
    <View style={[styles.marker, styles.markerFill]}>
      <Text style={[styles.markerText, styles.markerTextOn]}>{(position ?? 0) + 1}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { width: 40, alignItems: "center" },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.halo },
  dashed: {
    width: 0,
    backgroundColor: "transparent",
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.mist,
  },
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
  markerFill: { backgroundColor: colors.sage },
  dot: {
    width: 14,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.sage,
    borderWidth: 3,
    borderColor: colors.canvas,
  },
  markerText: { color: colors.sageDeep, fontFamily: fonts.semibold, fontSize: 13 },
  markerTextOn: { color: colors.white },
});
