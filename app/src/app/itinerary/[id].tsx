import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BookSheet } from '@/components/BookSheet';
import { ItineraryCard } from '@/components/ItineraryCard';
import { MapCard } from '@/components/MapCard';
import { StageProgress } from '@/components/StageProgress';
import { StatusPill } from '@/components/StatusPill';
import { TransitButton } from '@/components/TransitButton';
import { serverUrl } from '@/lib/api';
import { useItinerary } from '@/lib/useItinerary';
import { colors, radius, spacing } from '@/lib/theme';

export default function ItineraryScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { itinerary, error, apply } = useItinerary(id);

  if (!itinerary) {
    return (
      <View style={styles.center}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ActivityIndicator color={colors.tide} />
        )}
      </View>
    );
  }

  const { booking } = itinerary;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {itinerary.coverUrl && (
        <View style={styles.heroWrap}>
          <Image source={{ uri: serverUrl(itinerary.coverUrl) }} style={styles.hero} />
          <View style={styles.heroPill}>
            <StatusPill status={itinerary.status} />
          </View>
        </View>
      )}
      {!itinerary.coverUrl && booking && <StatusPill status={itinerary.status} />}
      {!booking && <StageProgress stage={itinerary.stage} error={itinerary.error} />}
      {booking && (
        <>
          <ItineraryCard booking={booking} servedFrom={itinerary.servedFrom} />
          <MapCard point={booking.meeting_point} />
          <TransitButton point={booking.meeting_point} />
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
                  {message.direction === 'outbound' ? 'You -> operator' : 'Operator'}:{' '}
                  {message.text}
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
  container: { padding: spacing(4), gap: spacing(3.5), paddingBottom: spacing(10) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(6) },
  error: { color: colors.danger, fontSize: 14 },
  heroWrap: { borderRadius: radius.card, overflow: 'hidden' },
  hero: { width: '100%', height: 200 },
  heroPill: { position: 'absolute', top: spacing(3), left: spacing(3) },
  messages: { gap: spacing(2), marginTop: spacing(1), paddingHorizontal: spacing(1) },
  message: { color: colors.inkSoft, fontSize: 12, lineHeight: 17 },
  inbound: { color: colors.confirm, fontWeight: '600' },
});
