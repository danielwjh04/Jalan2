import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow, colors, fonts, hairline, radius, spacing } from '@/lib/theme';

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
      <Ionicons name="link-outline" size={20} color={colors.inkSoft} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="Paste a TikTok or XHS find"
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
        {busy ? (
          <ActivityIndicator color={colors.kopi} />
        ) : (
          <Ionicons name="arrow-forward" size={20} color={colors.kopi} />
        )}
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
    paddingLeft: spacing(3.5),
    paddingRight: spacing(1.5),
    paddingVertical: spacing(1.5),
    ...hairline,
    ...cardShadow,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: spacing(2),
  },
  searchIcon: { marginRight: spacing(2) },
  button: {
    backgroundColor: colors.kaya,
    borderRadius: radius.pill,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing(2),
  },
  buttonDisabled: { opacity: 0.4 },
});
