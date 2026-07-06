import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Itinerary } from '@shared/status';
import { book } from '@/lib/api';
import { colors, radius, spacing } from '@/lib/theme';

interface Props {
  itineraryId: string;
  onBooked: (updated: Itinerary) => void;
}

interface DateOption {
  iso: string;
  label: string;
}

function upcomingDates(count: number): DateOption[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    return {
      iso: date.toISOString().slice(0, 10),
      label: date.toDateString().slice(0, 10),
    };
  });
}

export function BookSheet({ itineraryId, onBooked }: Props): React.ReactElement {
  const dates = useMemo(() => upcomingDates(3), []);
  const [dateISO, setDateISO] = useState(dates[0].iso);
  const [pax, setPax] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      onBooked(await book(itineraryId, { dateISO, pax }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Book direct with the operator</Text>
      <View style={styles.chipRow}>
        {dates.map((option) => (
          <Pressable
            key={option.iso}
            style={[styles.chip, option.iso === dateISO && styles.chipActive]}
            onPress={() => setDateISO(option.iso)}
          >
            <Text style={[styles.chipText, option.iso === dateISO && styles.chipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.paxRow}>
        <Text style={styles.paxLabel}>Pax</Text>
        <Pressable style={styles.stepper} onPress={() => setPax(Math.max(1, pax - 1))}>
          <Text style={styles.stepperText}>-</Text>
        </Pressable>
        <Text style={styles.paxValue}>{pax}</Text>
        <Pressable style={styles.stepper} onPress={() => setPax(Math.min(8, pax + 1))}>
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>
      <Pressable style={[styles.bookButton, busy && styles.busy]} disabled={busy} onPress={() => void submit()}>
        {busy ? (
          <ActivityIndicator color="#1A1208" />
        ) : (
          <Text style={styles.bookText}>Book via WhatsApp</Text>
        )}
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.note}>Nothing is sent or paid until you tap Book.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing(4),
    gap: spacing(3),
  },
  heading: { color: colors.text, fontWeight: '700', fontSize: 16 },
  chipRow: { flexDirection: 'row', gap: spacing(2) },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  chipActive: { borderColor: colors.accent, backgroundColor: '#2A1D10' },
  chipText: { color: colors.textDim, fontSize: 13 },
  chipTextActive: { color: colors.accent, fontWeight: '600' },
  paxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  paxLabel: { color: colors.textDim, fontSize: 14, marginRight: spacing(1) },
  stepper: {
    width: 36,
    height: 36,
    borderRadius: radius.control,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  paxValue: { color: colors.text, fontSize: 17, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  bookButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.control,
    paddingVertical: spacing(3.5),
    alignItems: 'center',
  },
  busy: { opacity: 0.7 },
  bookText: { color: '#1A1208', fontWeight: '800', fontSize: 16 },
  error: { color: colors.danger, fontSize: 13 },
  note: { color: colors.textDim, fontSize: 12, textAlign: 'center' },
});
