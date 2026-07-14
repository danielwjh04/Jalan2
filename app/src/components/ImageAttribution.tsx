import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageAttribution as Attribution } from '@shared/media';
import { colors, spacing, type } from '@/lib/theme';
import { tryOpenExternalUrl } from '@/lib/externalLink';

export function ImageAttribution({ items }: { items: Attribution[] }): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Pressable
          accessibilityRole="link"
          key={`${item.label}-${item.source_url}`}
          onPress={() => void tryOpenExternalUrl(item.source_url, Linking.openURL)}
        >
          <Text style={styles.text}>
            {item.label}{item.license ? ` | ${item.license}` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing(0.5) },
  text: { ...type.caption, color: colors.inkSoft, fontSize: 10 },
});
