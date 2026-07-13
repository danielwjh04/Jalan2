import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { BookSheet } from '@/components/BookSheet';
import { BoboCard } from '@/components/BoboCard';
import { ItineraryCard } from '@/components/ItineraryCard';
import { MapCard } from '@/components/MapCard';
import { SafetyBriefCard } from '@/components/SafetyBriefCard';
import { StageProgress } from '@/components/StageProgress';
import { StatusPill } from '@/components/StatusPill';
import { TransitButton } from '@/components/TransitButton';
import { ExperienceLink } from '@/components/ExperienceLink';
import { serverUrl } from '@/lib/api';
import { useItinerary } from '@/lib/useItinerary';
import { cardShadow, colors, fonts, gradients, radius, spacing } from '@/lib/theme';

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
          <LinearGradient colors={gradients.scrim} style={styles.heroScrim} />
          {booking && (
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>{booking.activity}</Text>
              <Text style={styles.heroSubtitle}>{booking.meeting_point.name}</Text>
            </View>
          )}
          <View style={styles.heroPill}>
            <StatusPill status={itinerary.status} />
          </View>
        </View>
      )}
      {!itinerary.coverUrl && booking && <StatusPill status={itinerary.status} />}
      {!booking && (
        <>
          <BoboCard
            compact
            title="I am reading the clues"
            message="Checking the post images, caption and local details before anything is bookable."
          />
          <StageProgress stage={itinerary.stage} error={itinerary.error} />
        </>
      )}
      {booking && (
        <>
          <ItineraryCard
            booking={booking}
            servedFrom={itinerary.servedFrom}
            showTitle={!itinerary.coverUrl}
          />
          <MapCard point={booking.meeting_point} />
          <TransitButton point={booking.meeting_point} />
          <SafetyBriefCard itineraryId={itinerary.id} />
          {itinerary.experienceId && (
            <ExperienceLink experienceId={itinerary.experienceId} bookingId={itinerary.id} />
          )}
          {itinerary.status === 'DRAFT' && (
            <BookSheet itineraryId={itinerary.id} booking={booking} onBooked={apply} />
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
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 14 },
  heroWrap: { borderRadius: radius.card, overflow: 'hidden', ...cardShadow },
  hero: { width: '100%', height: 330 },
  heroScrim: { ...StyleSheet.absoluteFillObject },
  heroText: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing(5),
    gap: spacing(0.5),
  },
  heroTitle: { color: colors.white, fontFamily: fonts.semibold, fontSize: 30, lineHeight: 35, letterSpacing: -0.6 },
  heroSubtitle: { color: 'rgba(255,255,255,0.78)', fontFamily: fonts.regular, fontSize: 14 },
  heroPill: { position: 'absolute', top: spacing(4), left: spacing(4) },
  messages: { gap: spacing(2), marginTop: spacing(1), paddingHorizontal: spacing(1) },
  message: { color: colors.inkSoft, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  inbound: { color: colors.confirm, fontFamily: fonts.medium },
});
