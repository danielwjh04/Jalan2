import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, hairline, radius, spacing, type } from "@/lib/theme";

interface Props {
  selected: boolean;
  canRemove: boolean;
  editable: boolean;
  hasEasybook: boolean;
  onViewSource: () => void;
  onToggle: () => void;
  onEasybook: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function StopActionMenu(props: Props): React.ReactElement {
  return (
    <View accessibilityRole="menu" style={styles.menu}>
      <ActionRow
        icon="open-outline"
        label="View source"
        onPress={props.onViewSource}
      />
      {props.editable && (!props.selected || props.canRemove) ? (
        <ActionRow
          icon={props.selected ? "remove-circle-outline" : "add-circle-outline"}
          label={props.selected ? "Remove from itinerary" : "Add to itinerary"}
          onPress={props.onToggle}
        />
      ) : null}
      {props.hasEasybook ? (
        <ActionRow
          icon="bus-outline"
          label="Open EasyBook"
          onPress={props.onEasybook}
        />
      ) : null}
      {props.editable ? (
        <ActionRow
          destructive
          icon="trash-outline"
          label="Delete place"
          onPress={props.onDelete}
        />
      ) : null}
      <ActionRow icon="close-outline" label="Close" onPress={props.onClose} />
    </View>
  );
}

function ActionRow(props: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  destructive?: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={props.onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <Ionicons
        name={props.icon}
        size={19}
        color={props.destructive ? colors.danger : colors.sageDeep}
      />
      <Text style={[styles.label, props.destructive && styles.destructive]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: {
    backgroundColor: colors.canvas,
    borderRadius: radius.control,
    overflow: "hidden",
    ...hairline,
  },
  action: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    paddingHorizontal: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  pressed: { backgroundColor: colors.halo },
  label: { ...type.label, color: colors.ink },
  destructive: { color: colors.danger },
});
