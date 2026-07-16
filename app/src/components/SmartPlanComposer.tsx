import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import type { SmartPlanRequest } from "@shared/planner";
import { createSmartPlan } from "@/lib/api";
import { cardShadow, colors, eyebrow, radius, spacing, type } from "@/lib/theme";

const PACES: SmartPlanRequest["pace"][] = ["relaxed", "balanced", "packed"];

export function SmartPlanComposer(): React.ReactElement {
  const router = useRouter();
  const [origin, setOrigin] = useState("Kuala Lumpur");
  const [destination, setDestination] = useState("Gopeng");
  const [returnToOrigin, setReturnToOrigin] = useState(true);
  const [endDestination, setEndDestination] = useState("Kuala Lumpur");
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [days, setDays] = useState("2");
  const [travelers, setTravelers] = useState("2");
  const [budget, setBudget] = useState("800");
  const [interests, setInterests] = useState("caves, rafting, local food");
  const [pace, setPace] = useState<SmartPlanRequest["pace"]>("balanced");
  const [busy, setBusy] = useState(false);
  const submit = async (): Promise<void> => {
    setBusy(true);
    try {
      const trip = await createSmartPlan({
        origin: origin.trim(),
        destination: destination.trim(),
        return_to_origin: returnToOrigin,
        end_destination: returnToOrigin ? null : endDestination.trim(),
        start_date: startDate.trim(),
        days: Number(days),
        travelers: Number(travelers),
        budget_myr: budget.trim() ? Number(budget) : null,
        interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
        pace,
      });
      router.push(`/trip/${trip.id}`);
    } catch (error) {
      Alert.alert("Could not build the whole trip", error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.copy}><Text style={styles.eyebrow}>NO POST? START FROM SCRATCH</Text><Text style={styles.title}>Build a trip from an idea instead</Text></View>
        <Text style={styles.agentCount}>7 agents</Text>
      </View>
      <Text style={styles.intro}>Tell Jalan2 where you are going and what you like. The same planning agents will ground places, connect transport, balance days and flag booking gaps.</Text>
      <View style={styles.row}>
        <Field label="From" value={origin} onChangeText={setOrigin} />
        <Field label="To" value={destination} onChangeText={setDestination} />
      </View>
      <View><Text style={styles.label}>How does the journey finish?</Text><View style={styles.paces}>
        <Pressable style={[styles.pace, returnToOrigin && styles.paceActive]} onPress={() => setReturnToOrigin(true)}><Text style={[styles.paceText, returnToOrigin && styles.paceTextActive]}>Return to start</Text></Pressable>
        <Pressable style={[styles.pace, !returnToOrigin && styles.paceActive]} onPress={() => setReturnToOrigin(false)}><Text style={[styles.paceText, !returnToOrigin && styles.paceTextActive]}>End somewhere else</Text></Pressable>
      </View></View>
      {!returnToOrigin ? <Field label="Trip ends at" value={endDestination} onChangeText={setEndDestination} hint="Required final city or station" /> : <Text style={styles.endpointNote}>Final endpoint: {origin.trim() || "your starting point"}. Return EasyBook and KTMB options will be checked too.</Text>}
      <Field label="Start date" value={startDate} onChangeText={setStartDate} hint="YYYY-MM-DD" />
      <Field label="What sounds good?" value={interests} onChangeText={setInterests} hint="Comma-separated: diving, hiking, street food" />
      <View style={styles.row}>
        <Field small label="Days" value={days} onChangeText={setDays} keyboardType="number-pad" />
        <Field small label="Travelers" value={travelers} onChangeText={setTravelers} keyboardType="number-pad" />
        <Field small label="Budget (MYR)" value={budget} onChangeText={setBudget} keyboardType="number-pad" />
      </View>
      <View><Text style={styles.label}>Pace</Text><View style={styles.paces}>{PACES.map((item) => <Pressable key={item} style={[styles.pace, pace === item && styles.paceActive]} onPress={() => setPace(item)}><Text style={[styles.paceText, pace === item && styles.paceTextActive]}>{item}</Text></Pressable>)}</View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Build my end-to-end trip" disabled={busy} style={styles.button} onPress={() => void submit()}>
        {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Build my end-to-end trip</Text>}
      </Pressable>
      <Text style={styles.boundary}>Provider-backed where possible. Estimates and missing confirmations stay visible.</Text>
    </View>
  );
}

function defaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function Field(props: {
  label: string; value: string; onChangeText: (value: string) => void;
  hint?: string; small?: boolean; keyboardType?: "number-pad";
}): React.ReactElement {
  return (
    <View style={[styles.field, props.small && styles.fieldSmall]}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput accessibilityLabel={props.label} style={styles.input} value={props.value} onChangeText={props.onChangeText} keyboardType={props.keyboardType} placeholder={props.hint} placeholderTextColor={colors.inkSoft} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing(5), gap: spacing(3), backgroundColor: colors.card, borderRadius: radius.card, ...cardShadow },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing(3) },
  copy: { flex: 1, gap: spacing(1) },
  eyebrow: { ...eyebrow },
  title: { ...type.display, color: colors.ink, fontSize: 27, lineHeight: 32 },
  agentCount: { ...type.label, color: colors.sageDeep, backgroundColor: colors.halo, paddingHorizontal: spacing(2.5), paddingVertical: spacing(1), borderRadius: radius.pill, overflow: "hidden" },
  intro: { ...type.body, color: colors.inkSoft },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2.5) },
  field: { flex: 1, minWidth: 210, gap: spacing(1) },
  fieldSmall: { minWidth: 105 },
  label: { ...type.caption, color: colors.sageDeep, textTransform: "uppercase", letterSpacing: 0.7 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.mist, borderRadius: radius.control, paddingHorizontal: spacing(3), color: colors.ink, backgroundColor: colors.canvas, ...type.body },
  paces: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2), marginTop: spacing(1) },
  pace: { paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), borderRadius: radius.pill, backgroundColor: colors.canvas },
  paceActive: { backgroundColor: colors.sageDeep },
  paceText: { ...type.label, color: colors.inkSoft, textTransform: "capitalize" },
  paceTextActive: { color: colors.white },
  endpointNote: { ...type.caption, color: colors.sageDeep, padding: spacing(2.5), borderRadius: radius.control, backgroundColor: colors.halo },
  button: { minHeight: 54, borderRadius: radius.control, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing(4) },
  buttonText: { ...type.button, color: colors.white },
  boundary: { ...type.caption, color: colors.inkSoft, textAlign: "center" },
});
