import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { buildTransitLinks, type MeetingPoint } from '@shared/transit';
import { tryOpenExternalUrl } from '@/lib/externalLink';
import { colors, fonts, radius, spacing } from '@/lib/theme';

export function TransitButton({ point }: { point: MeetingPoint }): React.ReactElement {
  const links = buildTransitLinks(point);
  return (
    <View style={styles.row}>
      <LinkButton label="Get there" url={links.mapsUrl} primary />
      {links.easybookUrl && <LinkButton label="Bus tickets" url={links.easybookUrl} />}
    </View>
  );
}

function LinkButton({
  label,
  url,
  primary = false,
}: {
  label: string;
  url: string;
  primary?: boolean;
}): React.ReactElement {
  const open = async (): Promise<void> => {
    if (!(await tryOpenExternalUrl(url))) {
      Alert.alert('Could not open link', 'No app on this phone can open that address.');
    }
  };
  return (
    <Pressable style={[styles.button, primary ? styles.primary : styles.tonal]} onPress={() => void open()}>
      <Text style={[styles.text, primary ? styles.primaryText : styles.tonalText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing(2.5) },
  button: {
    flex: 1,
    borderRadius: radius.control,
    paddingVertical: spacing(3.5),
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.sageDeep },
  tonal: { backgroundColor: colors.halo },
  text: { fontFamily: fonts.semibold, fontSize: 14 },
  primaryText: { color: colors.white },
  tonalText: { color: colors.sageDeep },
});
