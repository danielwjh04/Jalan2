import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { buildTransitLinks, type MeetingPoint } from '@shared/transit';
import { colors, radius, spacing } from '@/lib/theme';

interface Props {
  point: MeetingPoint;
  dateISO: string | null;
}

export function TransitButton({ point, dateISO }: Props): React.ReactElement {
  const links = buildTransitLinks(point, dateISO);
  return (
    <View style={styles.row}>
      {links.easybookUrl && (
        <LinkButton label="Bus tickets (EasyBook)" url={links.easybookUrl} />
      )}
      <LinkButton label="Get there (Maps)" url={links.mapsUrl} />
    </View>
  );
}

function LinkButton({ label, url }: { label: string; url: string }): React.ReactElement {
  return (
    <Pressable style={styles.button} onPress={() => void Linking.openURL(url)}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing(2) },
  button: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingVertical: spacing(3),
    alignItems: 'center',
  },
  text: { color: colors.text, fontWeight: '600', fontSize: 13 },
});
