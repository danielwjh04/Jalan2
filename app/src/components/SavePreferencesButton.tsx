import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing, type } from "@/lib/theme";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

interface Props {
  saved: boolean;
  onPress: () => void;
}

export function SavePreferencesButton({ saved, onPress }: Props): React.ReactElement {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    opacity.setValue(0);
    scale.setValue(0.96);
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 24,
        bounciness: 3,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, saved, scale]);
  return (
    <Pressable style={[styles.button, saved && styles.saved]} onPress={onPress}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Text style={[styles.label, saved && styles.savedLabel]}>
          {saved ? "Saved" : "Save preferences"}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.control,
    backgroundColor: colors.kaya,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing(2),
  },
  saved: { backgroundColor: colors.sage },
  label: { ...type.button, color: colors.kopi },
  savedLabel: { color: colors.white },
});
