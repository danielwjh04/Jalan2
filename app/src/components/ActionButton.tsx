import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, type } from "@/lib/theme";

// "primary" is the sageDeep secondary-button tier, not kaya. Kaya stays GradientButton, so ActionButton never renders kaya.
type Variant = "primary" | "tonal" | "ghost";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  block?: boolean;
  underline?: boolean;
  accessibilityRole?: "button" | "link";
  accessibilityLabel?: string;
  accessibilityState?: { expanded?: boolean; selected?: boolean };
  style?: StyleProp<ViewStyle>;
}

export function ActionButton({
  label,
  onPress,
  variant = "tonal",
  icon,
  block = false,
  underline = false,
  accessibilityRole = "button",
  accessibilityLabel,
  accessibilityState,
  style,
}: Props): React.ReactElement {
  const tint = TEXT_COLOR[variant];
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        block && styles.block,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={tint} /> : null}
      <Text style={[styles.label, { color: tint }, underline && styles.underline]}>{label}</Text>
    </Pressable>
  );
}

const TEXT_COLOR: Record<Variant, string> = {
  primary: colors.white,
  tonal: colors.sageDeep,
  ghost: colors.sageDeep,
};

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(1.5),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
  },
  block: { alignSelf: "stretch" },
  pressed: { opacity: 0.7 },
  primary: { backgroundColor: colors.sageDeep },
  tonal: { backgroundColor: colors.halo },
  ghost: { backgroundColor: "transparent", paddingHorizontal: spacing(1.5) },
  label: { ...type.label },
  underline: { textDecorationLine: "underline" },
});
