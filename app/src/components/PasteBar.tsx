import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { cardShadow, colors, fonts, radius, spacing, type } from '@/lib/theme';

interface Props {
  prefill: string;
  busy: boolean;
  onSubmit: (raw: string) => void;
}

export function PasteBar({ prefill, busy, onSubmit }: Props): React.ReactElement {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (prefill) setValue(prefill);
  }, [prefill]);

  const disabled = busy || !value.trim();
  return (
    <View style={styles.bar}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="Paste a TikTok or XHS link"
        placeholderTextColor={colors.inkSoft}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />
      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        disabled={disabled}
        onPress={() => onSubmit(value)}
      >
        {busy ? <ActivityIndicator color={colors.card} /> : <Text style={styles.buttonText}>Go</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingLeft: spacing(4),
    paddingRight: spacing(1.5),
    paddingVertical: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.mist,
    ...cardShadow,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: spacing(2),
  },
  button: {
    backgroundColor: colors.tide,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(2.5),
    marginLeft: spacing(2),
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { ...type.button, color: colors.card },
});
