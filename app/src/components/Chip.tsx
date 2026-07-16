import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { colors, radius, spacing, type } from "@/lib/theme";

type Tone = "default" | "plain" | "strong" | "overlay";

interface Props {
  label: string;
  tone?: Tone;
  style?: StyleProp<TextStyle>;
}

export function Chip({ label, tone = "default", style }: Props): React.ReactElement {
  return <Text style={[styles.chip, styles[tone], style]}>{label}</Text>;
}

const styles = StyleSheet.create({
  chip: {
    ...type.caption,
    overflow: "hidden",
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
  },
  default: { color: colors.sageDeep, backgroundColor: colors.halo },
  plain: { color: colors.inkSoft, backgroundColor: colors.canvas },
  strong: { color: colors.kopi, backgroundColor: colors.kayaTint },
  overlay: { color: colors.white, backgroundColor: "rgba(28,41,37,0.72)" },
});
