import { Image, StyleSheet, Text, View } from 'react-native';
import type { Dish } from '@shared/menu';
import { cardShadow, colors, fonts, radius, spacing, type } from '@/lib/theme';
import { ImageAttribution } from './ImageAttribution';

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
        <ImageAttribution items={dish.image_attributions} />
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
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.halo },
  placeholderText: { color: colors.sage, fontFamily: fonts.semibold, fontSize: 64 },
  placeholderCaption: { ...type.caption, color: colors.inkSoft, marginTop: spacing(1) },
  body: { padding: spacing(4), gap: spacing(1.5) },
  name: { ...type.title, color: colors.ink },
  english: { ...type.body, color: colors.inkSoft },
  price: { color: colors.sageDeep, fontFamily: fonts.semibold, fontSize: 16 },
  allergenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1.5) },
  allergen: {
    color: colors.pending,
    backgroundColor: colors.pendingSoft,
    fontFamily: fonts.medium,
    fontSize: 11,
    borderRadius: radius.pill,
    paddingVertical: spacing(0.75),
    paddingHorizontal: spacing(2),
    overflow: 'hidden',
  },
  caption: { ...type.caption, color: colors.inkSoft },
});
