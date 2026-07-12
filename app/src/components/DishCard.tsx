import { Image, StyleSheet, Text, View } from 'react-native';
import type { Dish } from '@shared/menu';
import { cardShadow, colors, radius, spacing } from '@/lib/theme';

export function DishCard({ dish }: { dish: Dish }): React.ReactElement {
  return (
    <View style={styles.card}>
      {dish.image_url ? (
        <Image source={{ uri: dish.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>{dish.name_local.slice(0, 1)}</Text>
          <Text style={styles.placeholderCaption}>No photo yet</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name}>{dish.name_local}</Text>
        <Text style={styles.english}>{dish.name_english}</Text>
        <Text style={styles.price}>
          {dish.price_myr === null ? 'Price not shown' : `RM${dish.price_myr}`}
        </Text>
        {dish.allergens.length > 0 && (
          <View style={styles.allergenRow}>
            {dish.allergens.map((allergen) => (
              <Text key={allergen} style={styles.allergen}>
                {allergen}
              </Text>
            ))}
          </View>
        )}
        <Text style={styles.caption}>Allergens are typical-recipe guesses; check with the stall.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  image: { width: '100%', height: 240 },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tideSoft },
  placeholderText: { fontSize: 64, fontWeight: '800', color: colors.tide },
  placeholderCaption: { color: colors.inkSoft, fontSize: 12, marginTop: spacing(1) },
  body: { padding: spacing(4), gap: spacing(1.5) },
  name: { color: colors.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  english: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  price: { color: colors.tide, fontSize: 16, fontWeight: '800' },
  allergenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1.5) },
  allergen: {
    color: colors.pending,
    backgroundColor: colors.pendingSoft,
    fontSize: 11,
    fontWeight: '700',
    borderRadius: radius.pill,
    paddingVertical: spacing(0.75),
    paddingHorizontal: spacing(2),
    overflow: 'hidden',
  },
  caption: { color: colors.inkSoft, fontSize: 10 },
});
