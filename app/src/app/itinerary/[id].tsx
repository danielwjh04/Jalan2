import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BookSheet } from '@/components/BookSheet';
import { ItineraryCard } from '@/components/ItineraryCard';
import { MapCard } from '@/components/MapCard';
import { StageProgress } from '@/components/StageProgress';
import { StatusPill } from '@/components/StatusPill';
import { TransitButton } from '@/components/TransitButton';
import { useItinerary } from '@/lib/useItinerary';
import { colors, spacing } from '@/lib/theme';

export default function ItineraryScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { itinerary, error, apply } = useItinerary(id);

  if (!itinerary) {
    return (
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.accent} />}
      </View>
    );
  }

  const { booking } = itinerary;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {!booking && <StageProgress stage={itinerary.stage} error={itinerary.error} />}
      {booking && (
        <>
          <StatusPill status={itinerary.status} />
          <ItineraryCard booking={booking} servedFrom={itinerary.servedFrom} />
          <MapCard point={booking.meeting_point} />
          <TransitButton
            point={booking.meeting_point}
            dateISO={itinerary.requested?.dateISO ?? booking.date_requested}
          />
          {itinerary.status === 'DRAFT' && (
            <BookSheet itineraryId={itinerary.id} onBooked={apply} />
          )}
          {itinerary.messages.length > 0 && (
            <View style={styles.messages}>
              {itinerary.messages.map((message, index) => (
                <Text
                  key={`${message.at}-${index}`}
                  style={[styles.message, message.direction === 'inbound' && styles.inbound]}
                >
                  {message.direction === 'outbound' ? 'You -> operator' : 'Operator'}: {message.text}
                </Text>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(4), gap: spacing(3) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(6) },
  error: { color: colors.danger, fontSize: 14 },
  messages: { gap: spacing(2), marginTop: spacing(2) },
  message: { color: colors.textDim, fontSize: 12 },
  inbound: { color: colors.confirm },
});
