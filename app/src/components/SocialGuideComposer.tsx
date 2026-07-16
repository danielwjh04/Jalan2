import { type RefObject, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appendSocialUrl, MAX_SOCIAL_SOURCES, parseSocialUrls, sourcePlatform } from "@/lib/socialPlanner";
import { colors, radius, spacing, type } from "@/lib/theme";

interface Props {
  initialUrls?: string[];
  prefill?: string;
  busy: boolean;
  error?: string | null;
  onGenerate: (urls: string[]) => void;
}

export function SocialGuideComposer({ initialUrls = [], prefill = "", busy, error, onGenerate }: Props): React.ReactElement {
  const [urls, setUrls] = useState(() => parseSocialUrls(initialUrls.join("\n")));
  const [value, setValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const input = useRef<TextInput>(null);
  useEffect(() => {
    if (prefill && urls.length === 0 && !value) setValue(prefill);
  }, [prefill, urls.length, value]);
  const addLink = (): void => {
    const result = appendSocialUrl(urls, value);
    setInputError(result.error);
    setUrls(result.urls);
    if (!result.error) setValue("");
  };
  const removeLink = (url: string): void => {
    setUrls((current) => current.filter((item) => item !== url));
    setInputError(null);
  };
  return (
    <View style={styles.composer}>
      <View style={styles.inputRow}>
        <Ionicons name="link-outline" size={19} color={colors.inkSoft} />
        <TextInput
          ref={input}
          accessibilityLabel="XHS or TikTok link"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          onChangeText={setValue}
          onSubmitEditing={addLink}
          placeholder="Paste a TikTok or XHS link"
          placeholderTextColor={colors.inkSoft}
          returnKeyType="done"
          style={styles.input}
          value={value}
        />
        <Pressable accessibilityRole="button" disabled={busy || !value.trim()} onPress={addLink} style={styles.addButton}>
          <Text style={styles.addText}>Add link</Text>
        </Pressable>
      </View>
      {urls.length > 0 ? <LinkQueue urls={urls} onRemove={removeLink} /> : null}
      {inputError || error ? <Text style={styles.error}>{inputError ?? error}</Text> : null}
      {urls.length > 0 ? <ComposerActions busy={busy} urls={urls} input={input} onGenerate={onGenerate} /> : null}
    </View>
  );
}

function ComposerActions({ busy, urls, input, onGenerate }: { busy: boolean; urls: string[]; input: RefObject<TextInput | null>; onGenerate: (urls: string[]) => void }): React.ReactElement {
  return (
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" disabled={busy || urls.length >= MAX_SOCIAL_SOURCES} onPress={() => input.current?.focus()} style={styles.moreButton}>
        <Ionicons name="add" size={18} color={colors.sageDeep} />
        <Text style={styles.moreText}>Add another link</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => onGenerate(urls)} style={styles.generateButton}>
        {busy ? <ActivityIndicator color={colors.kopi} /> : <Text style={styles.generateText}>Generate guide</Text>}
      </Pressable>
    </View>
  );
}

function LinkQueue({ urls, onRemove }: { urls: string[]; onRemove: (url: string) => void }): React.ReactElement {
  return (
    <View style={styles.queue}>
      {urls.map((url, index) => (
        <View key={url} style={styles.linkRow}>
          <View style={styles.index}><Text style={styles.indexText}>{index + 1}</Text></View>
          <View style={styles.linkCopy}><Text style={styles.platform}>{sourcePlatform(url)}</Text><Text numberOfLines={1} style={styles.url}>{url}</Text></View>
          <Pressable accessibilityLabel={`Remove ${sourcePlatform(url)} link ${index + 1}`} accessibilityRole="button" onPress={() => onRemove(url)}>
            <Ionicons name="close-circle" size={22} color={colors.inkSoft} />
            <Text style={styles.hidden}>Remove</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  composer: { gap: spacing(3) },
  inputRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: spacing(2), borderRadius: radius.control, borderWidth: 1, borderColor: colors.mist, backgroundColor: colors.canvas, paddingHorizontal: spacing(3) },
  input: { ...type.body, color: colors.ink, flex: 1, minWidth: 0 },
  addButton: { minHeight: 38, justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.halo, paddingHorizontal: spacing(3) },
  addText: { ...type.label, color: colors.sageDeep },
  queue: { gap: spacing(2) },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing(2), borderRadius: radius.control, backgroundColor: colors.halo, padding: spacing(2.5) },
  index: { width: 27, height: 27, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  indexText: { ...type.caption, color: colors.sageDeep },
  linkCopy: { flex: 1, minWidth: 0 },
  platform: { ...type.label, color: colors.ink },
  url: { ...type.caption, color: colors.inkSoft },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  moreButton: { minHeight: 48, flex: 1, minWidth: 150, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing(1), borderRadius: radius.control, backgroundColor: colors.halo },
  moreText: { ...type.button, color: colors.sageDeep },
  generateButton: { minHeight: 48, flex: 1, minWidth: 150, alignItems: "center", justifyContent: "center", borderRadius: radius.control, backgroundColor: colors.kaya },
  generateText: { ...type.button, color: colors.kopi },
  error: { ...type.caption, color: colors.danger },
  hidden: { width: 1, height: 1, opacity: 0, position: "absolute" },
});
