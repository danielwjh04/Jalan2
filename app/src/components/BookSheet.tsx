import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BookingJson } from '@shared/booking';
import type { Itinerary } from '@shared/status';
import { GradientButton } from '@/components/GradientButton';
import { book } from '@/lib/api';
import { cardShadow, colors, fonts, radius, spacing, type } from '@/lib/theme';
import { buildWhatsAppDeepLink } from '@/lib/whatsappLink';

interface Props {
  itineraryId: string;
  booking: BookingJson;
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

export function BookSheet({ itineraryId, booking, onBooked }: Props): React.ReactElement {
  const dates = useMemo(() => upcomingDates(3), []);
  const [dateISO, setDateISO] = useState(dates[0].iso);
  const [pax, setPax] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const requested = { dateISO, pax };
      const link = buildWhatsAppDeepLink(
        booking,
        requested,
        process.env.EXPO_PUBLIC_DEMO_WHATSAPP_NUMBER,
      );
      if (!link) {
        throw new Error('Set EXPO_PUBLIC_DEMO_WHATSAPP_NUMBER to open WhatsApp.');
      }
      const updated = await book(itineraryId, requested);
      void Linking.openURL(link).catch(() => undefined);
      onBooked(updated);
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
        {dates.map((option) => {
          const active = option.iso === dateISO;
          return (
            <Pressable
              key={option.iso}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setDateISO(option.iso)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
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
      <GradientButton label="Book via WhatsApp" busy={busy} onPress={() => void submit()} />
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.note}>Nothing is sent or paid until you tap Book.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing(5),
    gap: spacing(3.5),
    ...cardShadow,
  },
  heading: { ...type.heading, color: colors.ink },
  chipRow: { flexDirection: 'row', gap: spacing(2) },
  chip: {
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2.5),
  },
  chipActive: { backgroundColor: colors.tide },
  chipText: { color: colors.inkSoft, fontFamily: fonts.medium, fontSize: 13 },
  chipTextActive: { color: colors.card },
  paxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  paxLabel: { ...type.body, color: colors.inkSoft, marginRight: spacing(1) },
  stepper: {
    width: 38,
    height: 38,
    borderRadius: radius.control,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { color: colors.ink, fontFamily: fonts.medium, fontSize: 18 },
  paxValue: {
    color: colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
    minWidth: 22,
    textAlign: 'center',
  },
  error: { ...type.label, color: colors.danger, fontFamily: fonts.regular },
  note: { ...type.caption, color: colors.inkSoft, textAlign: 'center' },
});
