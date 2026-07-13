import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, type } from '@/lib/theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}

export function GradientButton({
  label,
  onPress,
  disabled = false,
  busy = false,
}: Props): React.ReactElement {
  return (
    <Pressable disabled={disabled || busy} onPress={onPress}>
      <LinearGradient
        colors={gradients.cta}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, (disabled || busy) && styles.dimmed]}
      >
        {busy ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={styles.text}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.control,
    paddingVertical: spacing(4),
    alignItems: 'center',
    shadowColor: colors.tide,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  dimmed: { opacity: 0.55 },
  text: { ...type.button, color: colors.black },
});
