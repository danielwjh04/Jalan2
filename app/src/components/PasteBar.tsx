import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '@/lib/theme';

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

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="Paste a TikTok or XHS video link"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />
      <Pressable
        style={[styles.button, (busy || !value.trim()) && styles.buttonDisabled]}
        disabled={busy || !value.trim()}
        onPress={() => onSubmit(value)}
      >
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.buttonText}>Go</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing(2) },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    color: colors.text,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.control,
    paddingHorizontal: spacing(5),
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#1A1208', fontWeight: '700', fontSize: 16 },
});
