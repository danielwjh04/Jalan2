import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activeTabForRouteName, PRIMARY_TABS } from "@/lib/navigation";
import { colors, fonts, spacing } from "@/lib/theme";

const TAB_ICONS: Record<string, {
  active: keyof typeof Ionicons.glyphMap;
  idle: keyof typeof Ionicons.glyphMap;
}> = {
  index: { active: "home", idle: "home-outline" },
  discover: { active: "search", idle: "search-outline" },
  trips: { active: "map", idle: "map-outline" },
  you: { active: "person", idle: "person-outline" },
};

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index];
  const activeTab = activeTabForRouteName(activeRoute?.name ?? "index");
  const visible = PRIMARY_TABS.map(({ name }) => state.routes.find((route) => route.name === name))
    .filter((route): route is NonNullable<typeof route> => Boolean(route));
  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, spacing(2)) }]} pointerEvents="box-none">
      <BlurView intensity={48} tint="dark" style={styles.bar}>
        <View pointerEvents="none" style={styles.overlay} />
        {visible.map((route) => {
          const focused = activeTab === route.name;
          const icons = TAB_ICONS[route.name];
          const label = descriptors[route.key].options.title ?? route.name;
          const onPress = (): void => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={styles.item}
              onPress={onPress}
            >
              <View style={[styles.slot, focused && styles.slotActive]}>
                <Ionicons
                  name={focused ? icons.active : icons.idle}
                  size={24}
                  color={focused ? colors.white : "rgba(255,255,255,0.64)"}
                />
                {focused ? <Text style={styles.label}>{label}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: spacing(4), right: spacing(4) },
  bar: {
    flexDirection: "row",
    borderRadius: 27,
    overflow: "hidden",
    padding: spacing(1.5),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#0C1012",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(42,44,47,0.9)" },
  item: { flex: 1, alignItems: "center" },
  slot: {
    width: "100%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 21,
  },
  slotActive: { backgroundColor: colors.sage },
  label: { color: colors.white, fontFamily: fonts.medium, fontSize: 9, letterSpacing: 0.2 },
});
