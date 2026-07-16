import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, type } from "@/lib/theme";

interface Props {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onDemo: () => void;
}

export function MenuHowItWorks({ visible, busy, onClose, onDemo }: Props): React.ReactElement {
  const openDemo = (): void => {
    onClose();
    onDemo();
  };
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.header}>
            <View><Text style={styles.eyebrow}>HOW IT WORKS</Text><Text style={styles.title}>From menu photo to food guide</Text></View>
            <Pressable accessibilityLabel="Close menu tutorial" accessibilityRole="button" onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <Step icon="camera-outline" number="1" text="Take a clear photo or choose one from your library." />
          <Step icon="scan-outline" number="2" text="Jalan2 reads each visible dish and keeps uncertain rows marked." />
          <Step icon="restaurant-outline" number="3" text="Swipe through photos, taste notes and local ordering phrases." />
          <Pressable accessibilityRole="button" disabled={busy} onPress={openDemo} style={styles.demoButton}>
            <Text style={styles.demoText}>Try sample menu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Step({ icon, number, text }: { icon: keyof typeof Ionicons.glyphMap; number: string; text: string }): React.ReactElement {
  return (
    <View style={styles.step}>
      <View style={styles.stepIcon}><Ionicons name={icon} size={20} color={colors.sageDeep} /></View>
      <View style={styles.stepCopy}><Text style={styles.stepNumber}>STEP {number}</Text><Text style={styles.stepText}>{text}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", backgroundColor: "rgba(18,28,24,0.48)", padding: spacing(5) },
  sheet: { width: "100%", maxWidth: 520, alignSelf: "center", gap: spacing(3), borderRadius: radius.card, backgroundColor: colors.card, padding: spacing(5) },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing(3) },
  eyebrow: { ...type.caption, color: colors.sageDeep, letterSpacing: 1.1 },
  title: { ...type.title, color: colors.ink, marginTop: spacing(1) },
  close: { width: 40, height: 40, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas },
  step: { flexDirection: "row", alignItems: "center", gap: spacing(3), borderRadius: radius.control, backgroundColor: colors.halo, padding: spacing(3) },
  stepIcon: { width: 42, height: 42, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  stepCopy: { flex: 1, gap: spacing(0.5) },
  stepNumber: { ...type.caption, color: colors.sageDeep },
  stepText: { ...type.body, color: colors.ink },
  demoButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radius.control, backgroundColor: colors.halo },
  demoText: { ...type.button, color: colors.sageDeep },
});
