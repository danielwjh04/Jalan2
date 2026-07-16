import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, hairline, radius, spacing, type } from "@/lib/theme";

interface Props {
  selected: boolean;
  canRemove: boolean;
  editable: boolean;
  onTioman: boolean;
  hasEasybook: boolean;
  onViewSource: () => void;
  onDirections: () => void;
  onGrab: () => void;
  onIslandTransport: () => void;
  onRemove: () => void;
  onEasybook: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function StopActionMenu(props: Props): React.ReactElement {
  const showRemove = props.editable && props.selected && props.canRemove;
  return (
    <View accessibilityRole="menu" style={styles.menu}>
      <Row label="View source" onPress={props.onViewSource} />
      <Row label={props.onTioman ? "View on map" : "Directions"} onPress={props.onDirections} />
      {props.onTioman ? (
        <Row label="Island transport" onPress={props.onIslandTransport} />
      ) : (
        <Row label="Open Grab" onPress={props.onGrab} />
      )}
      {props.hasEasybook ? <Row label="Open EasyBook" onPress={props.onEasybook} /> : null}
      {showRemove ? <Row label="Remove from itinerary" onPress={props.onRemove} /> : null}
      {props.editable ? <Row danger label="Delete place" onPress={props.onDelete} /> : null}
      <Row label="Close" onPress={props.onClose} />
    </View>
  );
}

function Row(props: {
  label: string;
  danger?: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={props.onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <Text style={[styles.label, props.danger && styles.danger]}>{props.label}</Text>
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
    justifyContent: "center",
    paddingHorizontal: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  pressed: { backgroundColor: colors.halo },
  label: { ...type.label, color: colors.ink },
  danger: { color: colors.danger },
});
