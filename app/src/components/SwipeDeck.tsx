import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import type { Dish } from "@shared/menu";
import { DishCard } from "@/components/DishCard";
import { colors, fonts, radius, spacing, type } from "@/lib/theme";

interface SwipeDeckProps {
  dishes: Dish[];
  onLike: (index: number) => void;
  onFinish: () => void;
  sourceMenuUrl?: string;
}

const SWIPE_THRESHOLD = 110;
const FLING_DISTANCE = 520;

export function SwipeDeck({ dishes, onLike, onFinish, sourceMenuUrl }: SwipeDeckProps): React.ReactElement {
  const [index, setIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const completeSwipe = (liked: boolean): void => {
    if (liked) onLike(index);
    const next = index + 1;
    x.value = 0;
    y.value = 0;
    setIndex(next);
    setSwiping(false);
    if (next >= dishes.length) onFinish();
  };
  const animateSwipe = (liked: boolean): void => {
    if (swiping) return;
    setSwiping(true);
    x.value = withTiming((liked ? 1 : -1) * FLING_DISTANCE, { duration: 180 }, () => runOnJS(completeSwipe)(liked));
  };
  const pan = Gesture.Pan().enabled(!swiping)
    .onUpdate((event) => { x.value = event.translationX; y.value = event.translationY; })
    .onEnd(() => {
      if (Math.abs(x.value) > SWIPE_THRESHOLD) {
        const liked = x.value > 0;
        x.value = withTiming(Math.sign(x.value) * FLING_DISTANCE, { duration: 180 }, () => runOnJS(completeSwipe)(liked));
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${x.value / 14}deg` }] }));
  const likeStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, x.value / SWIPE_THRESHOLD)) }));
  const passStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, -x.value / SWIPE_THRESHOLD)) }));
  const current = dishes[index];
  if (!current) return <View />;
  const next = dishes[index + 1];
  return (
    <View style={styles.stack}>
      <View style={styles.progressRow}><Text style={styles.progress}>TASTE {index + 1} OF {dishes.length}</Text><Text style={styles.progressHint}>Drag the card</Text></View>
      <View>
        {next ? <View style={styles.behind}><DishCard dish={next} sourceMenuUrl={sourceMenuUrl} /></View> : null}
        <GestureDetector gesture={pan}>
          <Animated.View style={cardStyle}>
            <DishCard dish={current} sourceMenuUrl={sourceMenuUrl} />
            <SwipeBadge label="SAVE" style={[styles.like, likeStyle]} />
            <SwipeBadge label="SKIP" style={[styles.pass, passStyle]} />
          </Animated.View>
        </GestureDetector>
      </View>
      <View style={styles.controls}>
        <ChoiceButton label="Skip dish" icon="close" color={colors.danger} onPress={() => animateSwipe(false)} />
        <Text style={styles.hint}>Left to skip{`\n`}Right to save</Text>
        <ChoiceButton label="Save dish" icon="heart" color={colors.confirm} onPress={() => animateSwipe(true)} />
      </View>
    </View>
  );
}

function SwipeBadge({ label, style }: { label: string; style: object }): React.ReactElement {
  return <Animated.View style={[styles.badge, style]}><Text style={styles.badgeText}>{label}</Text></Animated.View>;
}

function ChoiceButton(props: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }): React.ReactElement {
  return <Pressable accessibilityLabel={props.label} accessibilityRole="button" onPress={props.onPress} style={styles.choice}><Ionicons name={props.icon} size={27} color={props.color} /></Pressable>;
}

const styles = StyleSheet.create({
  stack: { gap: spacing(3) },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progress: { ...type.caption, color: colors.sageDeep, fontFamily: fonts.semibold, letterSpacing: 1 },
  progressHint: { ...type.caption, color: colors.inkSoft },
  behind: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 0.97 }, { translateY: 10 }], opacity: 0.55 },
  badge: { position: "absolute", top: spacing(5), borderRadius: radius.control, borderWidth: 3, paddingVertical: spacing(1), paddingHorizontal: spacing(2.5) },
  like: { left: spacing(4), borderColor: colors.confirm, transform: [{ rotate: "-12deg" }] },
  pass: { right: spacing(4), borderColor: colors.danger, transform: [{ rotate: "12deg" }] },
  badgeText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 17 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing(5) },
  choice: { width: 58, height: 58, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.mist },
  hint: { ...type.caption, color: colors.inkSoft, textAlign: "center" },
});
