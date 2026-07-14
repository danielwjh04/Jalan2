import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '@/lib/theme';

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'home', idle: 'home-outline' },
  directory: { active: 'storefront', idle: 'storefront-outline' },
};

// Charcoal glass bar in the Apple style: large icons, and the label renders
// only under the tab that is currently active.
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: insets.bottom + spacing(3) }]} pointerEvents="box-none">
      <BlurView intensity={40} tint="dark" style={styles.bar}>
        <View style={styles.overlay} />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icons = TAB_ICONS[route.name] ?? TAB_ICONS.index;
          const label = descriptors[route.key].options.title ?? route.name;
          const onPress = (): void => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
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
                  size={26}
                  color={focused ? colors.white : 'rgba(255,255,255,0.62)'}
                />
                {focused && <Text style={styles.label}>{label}</Text>}
              </View>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing(4), right: spacing(4) },
  bar: {
    flexDirection: 'row',
    borderRadius: 26,
    overflow: 'hidden',
    padding: spacing(2),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#0C1012',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(42,44,47,0.88)' },
  item: { flex: 1, alignItems: 'center' },
  slot: {
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    borderRadius: 19,
  },
  slotActive: { backgroundColor: colors.sage },
  label: { color: colors.white, fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.2 },
});
