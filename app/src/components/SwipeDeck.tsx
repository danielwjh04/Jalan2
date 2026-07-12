import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Dish } from '@shared/menu';
import { DishCard } from '@/components/DishCard';
import { colors, radius, spacing } from '@/lib/theme';

interface SwipeDeckProps {
  dishes: Dish[];
  onLike: (index: number) => void;
  onFinish: () => void;
}

const SWIPE_THRESHOLD = 110;
const FLING_DISTANCE = 520;

export function SwipeDeck({ dishes, onLike, onFinish }: SwipeDeckProps): React.ReactElement {
  const [index, setIndex] = useState(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const completeSwipe = (liked: boolean): void => {
    if (liked) onLike(index);
    const next = index + 1;
    x.value = 0;
    y.value = 0;
    setIndex(next);
    if (next >= dishes.length) onFinish();
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      x.value = event.translationX;
      y.value = event.translationY;
    })
    .onEnd(() => {
      if (Math.abs(x.value) > SWIPE_THRESHOLD) {
        const liked = x.value > 0;
        x.value = withTiming(Math.sign(x.value) * FLING_DISTANCE, { duration: 180 }, () => {
          runOnJS(completeSwipe)(liked);
        });
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${x.value / 14}deg` },
    ],
  }));
  const likeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, x.value / SWIPE_THRESHOLD)),
  }));
  const passStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, -x.value / SWIPE_THRESHOLD)),
  }));

  const current = dishes[index];
  if (!current) return <View />;
  const next = dishes[index + 1];

  return (
    <View style={styles.stack}>
      {next && (
        <View style={styles.behind}>
          <DishCard dish={next} />
        </View>
      )}
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <DishCard dish={current} />
          <Animated.View style={[styles.badge, styles.like, likeStyle]}>
            <Text style={styles.badgeText}>SHORTLIST</Text>
          </Animated.View>
          <Animated.View style={[styles.badge, styles.pass, passStyle]}>
            <Text style={styles.badgeText}>SKIP</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <Text style={styles.hint}>
        Swipe right to shortlist, left to skip ({index + 1}/{dishes.length})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing(3) },
  behind: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 0.96 }, { translateY: 10 }],
    opacity: 0.6,
  },
  badge: {
    position: 'absolute',
    top: spacing(4),
    borderRadius: radius.control,
    borderWidth: 3,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2.5),
  },
  like: { left: spacing(4), borderColor: colors.confirm, transform: [{ rotate: '-12deg' }] },
  pass: { right: spacing(4), borderColor: colors.danger, transform: [{ rotate: '12deg' }] },
  badgeText: { fontWeight: '800', fontSize: 16, color: colors.ink },
  hint: { color: colors.inkSoft, fontSize: 12, textAlign: 'center' },
});
