import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cardShadow, colors, eyebrow, radius, spacing, type } from "@/lib/theme";

export interface AgentProgressStep {
  label: string;
  detail: string;
}

interface Props {
  title: string;
  intro: string;
  steps: AgentProgressStep[];
  activeIndex: number;
}

export function AgentProgress({ title, intro, steps, activeIndex }: Props): React.ReactElement {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SENDING AGENTS</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.intro}>{intro}</Text>
      </View>
      <View style={styles.steps}>
        {steps.map((step, index) => {
          const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "todo";
          return (
            <View key={step.label} style={[styles.step, state === "active" && styles.stepActive]}>
              <View style={[styles.status, state === "done" && styles.statusDone]}>
                {state === "done" ? (
                  <Ionicons name="checkmark" size={15} color={colors.white} />
                ) : state === "active" ? (
                  <ActivityIndicator size="small" color={colors.sageDeep} />
                ) : (
                  <Text style={styles.number}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.copy}>
                <Text style={[styles.label, state === "todo" && styles.labelTodo]}>{step.label}</Text>
                {state === "active" ? <Text style={styles.detail}>{step.detail}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={styles.footnote}>The final critic checks timing, transport handoffs and unsupported claims before the guide opens.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing(5), gap: spacing(4), ...cardShadow },
  header: { gap: spacing(1) },
  eyebrow: { ...eyebrow },
  title: { ...type.title, color: colors.ink },
  intro: { ...type.body, color: colors.inkSoft },
  steps: { gap: spacing(1.5) },
  step: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: spacing(3), borderRadius: radius.control, paddingHorizontal: spacing(3), paddingVertical: spacing(2), backgroundColor: colors.canvas },
  stepActive: { backgroundColor: colors.halo },
  status: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.mist },
  statusDone: { backgroundColor: colors.confirm },
  number: { ...type.caption, color: colors.inkSoft },
  copy: { flex: 1, gap: spacing(0.5) },
  label: { ...type.label, color: colors.ink },
  labelTodo: { color: colors.inkSoft },
  detail: { ...type.caption, color: colors.sageDeep },
  footnote: { ...type.caption, color: colors.inkSoft },
});
