import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, type } from "@/lib/theme";

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: Props): React.ReactElement {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: spacing(1),
    borderRadius: radius.control,
    backgroundColor: colors.mist,
  },
  option: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center" },
  optionActive: { backgroundColor: colors.card, borderRadius: radius.control - 4 },
  label: { ...type.label, color: colors.inkSoft },
  labelActive: { color: colors.ink },
});
