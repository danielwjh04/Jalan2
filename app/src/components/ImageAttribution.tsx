import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ImageAttribution as Attribution } from "@shared/media";
import { cardShadow, colors, radius, spacing, type } from "@/lib/theme";
import { tryOpenExternalUrl } from "@/lib/externalLink";

export function ImageAttribution({
  items,
}: {
  items: Attribution[];
}): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <View style={styles.container}>
      {open ? <CreditPopover items={items} /> : null}
      <Pressable
        accessibilityLabel="Photo credits"
        accessibilityRole="button"
        onPress={() => setOpen((visible) => !visible)}
        style={styles.button}
      >
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.white}
        />
      </Pressable>
    </View>
  );
}

function CreditPopover({
  items,
}: {
  items: Attribution[];
}): React.ReactElement {
  return (
    <View style={styles.popover}>
      <Text style={styles.heading}>Photo credits</Text>
      {items.map((item) => (
        <Pressable
          accessibilityRole="link"
          key={`${item.label}-${item.source_url}`}
          onPress={() =>
            void tryOpenExternalUrl(item.source_url)
          }
        >
          <Text style={styles.text}>
            {item.label}
            {item.license ? ` | ${item.license}` : ""}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: spacing(2),
    bottom: spacing(2),
    zIndex: 4,
    alignItems: "flex-end",
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: "rgba(28,41,37,0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  popover: {
    width: 220,
    marginBottom: spacing(2),
    borderRadius: radius.control,
    backgroundColor: colors.card,
    padding: spacing(3),
    gap: spacing(1),
    ...cardShadow,
  },
  heading: { ...type.label, color: colors.ink },
  text: { ...type.caption, color: colors.sageDeep, fontSize: 10 },
});
