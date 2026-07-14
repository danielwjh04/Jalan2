import { Pressable, StyleSheet, Text, View } from "react-native";
import { BoboCard } from "./BoboCard";
import { colors, radius, spacing, type } from "@/lib/theme";

interface Props {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function StateCard({ title, message, actionLabel, onAction }: Props): React.ReactElement {
  return (
    <View style={styles.wrap}>
      <BoboCard compact title={title} message={message} />
      {actionLabel && onAction ? (
        <Pressable style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing(3) },
  action: {
    minHeight: 48,
    borderRadius: radius.control,
    backgroundColor: colors.sageDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { ...type.button, color: colors.white },
});
