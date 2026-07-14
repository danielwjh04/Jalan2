import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, eyebrow, radius, spacing, type } from "@/lib/theme";

interface Props {
  title: string;
  eyebrowText?: string;
  onBack?: () => void;
  action?: ReactNode;
}

export function ScreenHeader({ title, eyebrowText, onBack, action }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing(3) }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable accessibilityLabel="Go back" style={styles.control} onPress={onBack}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
        ) : <View style={styles.controlSpacer} />}
        <View style={styles.copy}>
          {eyebrowText ? <Text style={styles.eyebrow}>{eyebrowText}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.action}>{action}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing(5), paddingBottom: spacing(4) },
  row: { flexDirection: "row", alignItems: "center", minHeight: 48 },
  copy: { flex: 1, alignItems: "center" },
  eyebrow: { ...eyebrow, fontSize: 9 },
  title: { ...type.title, color: colors.ink },
  control: {
    width: 42,
    height: 42,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  controlSpacer: { width: 42 },
  action: { width: 42, alignItems: "flex-end" },
});
