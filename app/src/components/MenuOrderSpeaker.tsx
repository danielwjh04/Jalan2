import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { MenuOrderClipResponse, MenuOrderLanguage } from '@shared/api';
import type { Dish } from '@shared/menu';
import { getMenuOrderAudio, serverUrl } from '@/lib/api';
import { colors, fonts, radius, spacing, type } from '@/lib/theme';

const LANGUAGES: Array<{ lang: MenuOrderLanguage; short: string; label: string }> = [
  { lang: 'ms', short: 'BM', label: 'Malay' },
  { lang: 'yue', short: '粵', label: 'Cantonese' },
  { lang: 'zh', short: '普', label: 'Mandarin' },
];

interface MenuOrderSpeakerProps {
  menuId: string;
  dishIndex: number;
  dish: Dish;
}

export function MenuOrderSpeaker({ menuId, dishIndex, dish }: MenuOrderSpeakerProps): React.ReactElement {
  const [clips, setClips] = useState<Partial<Record<MenuOrderLanguage, MenuOrderClipResponse>>>({});
  const [activeLang, setActiveLang] = useState<MenuOrderLanguage>('ms');
  const [busyLang, setBusyLang] = useState<MenuOrderLanguage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const activeClip = clips[activeLang];
  const fallbackPhrase = useMemo(() => ({
    ms: dish.order_phrase,
    yue: `老闆，唔該畀我一份${dish.name_local}。`,
    zh: `老板，我要一份${dish.name_local}，谢谢。`,
  }), [dish.name_local, dish.order_phrase]);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (!queued || !status.isLoaded) return;
    setQueued(false);
    void player.seekTo(0).then(() => player.play());
  }, [player, queued, status.isLoaded]);

  const speak = async (lang: MenuOrderLanguage): Promise<void> => {
    setActiveLang(lang);
    setError(null);
    setBusyLang(lang);
    try {
      const clip = clips[lang] ?? await getMenuOrderAudio(menuId, dishIndex, lang);
      setClips((current) => ({ ...current, [lang]: clip }));
      if (!clip.audioUrl) {
        throw new Error(lang === 'yue'
          ? 'Cantonese voice unavailable. Enable Google Cloud Text-to-Speech for yue-HK.'
          : 'ElevenLabs voice is not configured on the server.');
      }
      player.replace(serverUrl(clip.audioUrl));
      setQueued(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate this order.');
    } finally {
      setBusyLang(null);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.icon}><Ionicons name="volume-high" size={18} color={colors.kopi} /></View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>SAY MY ORDER</Text>
          <Text style={styles.hint}>Tap a language, then point to the highlighted menu row.</Text>
        </View>
      </View>
      <View style={styles.languageRow}>
        {LANGUAGES.map((item) => {
          const selected = activeLang === item.lang;
          const busy = busyLang === item.lang;
          return (
            <Pressable
              accessibilityLabel={`Say order in ${item.label}`}
              key={item.lang}
              onPress={() => void speak(item.lang)}
              style={[styles.languageButton, selected && styles.languageButtonActive]}
            >
              {busy ? <ActivityIndicator size="small" color={selected ? colors.white : colors.sageDeep} /> : <Text style={[styles.short, selected && styles.activeText]}>{item.short}</Text>}
              <Text style={[styles.languageLabel, selected && styles.activeText]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.phraseBox}>
        <Text style={styles.phrase}>{activeClip?.textLocal ?? fallbackPhrase[activeLang]}</Text>
        <Text style={styles.translation}>{activeClip?.textEnglish ?? `Boss, one ${dish.name_english}, please.`}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.disclosure}>{activeLang === 'yue' ? 'Synthetic Google yue-HK voice' : 'Synthetic ElevenLabs voice'} · Verify special requests with the stall</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.kayaTint, borderRadius: radius.control, padding: spacing(3.5), gap: spacing(3) },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2.5) },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.kaya },
  headingCopy: { flex: 1, gap: spacing(0.5) },
  eyebrow: { color: colors.kopi, fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.1 },
  hint: { ...type.caption, color: colors.kopi },
  languageRow: { flexDirection: 'row', gap: spacing(2) },
  languageButton: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: radius.control, paddingHorizontal: spacing(1.5), paddingVertical: spacing(2) },
  languageButtonActive: { backgroundColor: colors.sageDeep },
  short: { color: colors.sageDeep, fontFamily: fonts.semibold, fontSize: 16 },
  languageLabel: { color: colors.inkSoft, fontFamily: fonts.medium, fontSize: 10, marginTop: 2 },
  activeText: { color: colors.white },
  phraseBox: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: radius.control, padding: spacing(3), gap: spacing(1) },
  phrase: { ...type.heading, color: colors.ink },
  translation: { ...type.caption, color: colors.inkSoft },
  disclosure: { ...type.caption, color: colors.kopi },
  error: { ...type.caption, color: colors.danger },
});
