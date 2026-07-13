import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { colors, fonts, radius, spacing } from '@/lib/theme';

interface VoiceButtonProps {
  audioUrl: string | null;
  label: string;
}

// Every clip is synthetic stock-voice TTS; the tag is a responsible AI
// requirement, not decoration. Remount with a key when audioUrl changes.
export function VoiceButton({ audioUrl, label }: VoiceButtonProps): React.ReactElement {
  const player = useAudioPlayer(audioUrl);
  useEffect(() => {
    // The iOS ring/silent switch mutes playback unless the session opts out.
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);
  const disabled = !audioUrl;
  const play = (): void => {
    player.seekTo(0);
    player.play();
  };
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={play}
      disabled={disabled}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]} numberOfLines={1}>
        {disabled ? 'Audio unavailable' : label}
      </Text>
      <View style={styles.tag}>
        <Text style={styles.tagText}>AI voice</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(2),
    backgroundColor: colors.tide,
    borderRadius: radius.control,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(3.5),
  },
  disabled: { backgroundColor: colors.mist },
  label: { color: colors.black, fontFamily: fonts.semibold, fontSize: 14, flexShrink: 1 },
  labelDisabled: { color: colors.inkSoft },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    paddingVertical: spacing(0.75),
    paddingHorizontal: spacing(2),
  },
  tagText: { color: colors.black, fontFamily: fonts.medium, fontSize: 11, letterSpacing: 0.6 },
});
