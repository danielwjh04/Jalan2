import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { Itinerary } from "@shared/status";
import { bookingViewFor, type BookingView } from "@/lib/bookingPresentation";
import { buildOperatorChatLink } from "@/lib/whatsappLink";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { colors, radius, spacing, type } from "@/lib/theme";
import { BookSheet } from "./BookSheet";
import { BookingDetailsCard } from "./BookingDetailsCard";
import { DiscoveredOperatorCard } from "./DiscoveredOperatorCard";
import { BookingHero } from "./BookingHero";
import { BookingMessages } from "./BookingMessages";
import { BookingProgress } from "./BookingProgress";
import { ExperienceLink } from "./ExperienceLink";
import { StageProgress } from "./StageProgress";
import { StateCard } from "./StateCard";

interface Props {
  itinerary: Itinerary;
  onBooked: (updated: Itinerary) => void;
  onViewTrip?: () => void;
  onStartFresh?: () => void;
}

export function BookingPanel(props: Props): React.ReactElement {
  const view = bookingViewFor(props.itinerary, null);
  const booking = props.itinerary.booking;
  if (!booking) {
    return (
      <View style={styles.panel}>
        <StateCard title="Bobo is reading the clues" message="The caption, frames, and local details are being fused into your trip." />
        <StageProgress stage={props.itinerary.stage} error={props.itinerary.error} />
      </View>
    );
  }
  return (
    <View style={styles.panel}>
      <BookingHero view={view} booking={booking} />
      <BookingProgress view={view} />
      <BookingDetailsCard itinerary={props.itinerary} />
      {props.itinerary.discoveredOperator ? (
        <DiscoveredOperatorCard discovered={props.itinerary.discoveredOperator} />
      ) : null}
      <BookingStateBody {...props} view={view} />
      {view !== "confirmed" && props.itinerary.experienceId ? (
        <ExperienceLink experienceId={props.itinerary.experienceId} bookingId={props.itinerary.id} />
      ) : null}
    </View>
  );
}

function BookingStateBody(props: Props & { view: BookingView }): React.ReactElement | null {
  const { itinerary, view } = props;
  if (!itinerary.booking) return null;
  if (view === "draft") {
    return <BookSheet itineraryId={itinerary.id} booking={itinerary.booking} onBooked={props.onBooked} />;
  }
  if (view === "waiting") return <BookingMessages messages={itinerary.messages} />;
  if (view === "failed") {
    return <StateCard title="The request did not complete" message={itinerary.error ?? "The operator could not confirm this request."} actionLabel={props.onStartFresh ? "Start a fresh trip" : undefined} onAction={props.onStartFresh} />;
  }
  if (view === "confirmed") return <ConfirmedActions itinerary={itinerary} onViewTrip={props.onViewTrip} />;
  return null;
}

function ConfirmedActions({ itinerary, onViewTrip }: { itinerary: Itinerary; onViewTrip?: () => void }): React.ReactElement {
  const chatLink = buildOperatorChatLink(itinerary.operatorAddress);
  return (
    <View style={styles.actions}>
      {onViewTrip && itinerary.tripId ? (
        <Pressable style={styles.primary} onPress={onViewTrip}><Text style={styles.primaryText}>Back to my itinerary</Text></Pressable>
      ) : null}
      {chatLink ? (
        <Pressable style={styles.secondary} onPress={() => void openChat(chatLink)}><Text style={styles.secondaryText}>Chat on WhatsApp</Text></Pressable>
      ) : null}
      <BookingMessages messages={itinerary.messages} />
    </View>
  );
}

async function openChat(url: string): Promise<void> {
  if (await tryOpenExternalUrl(url, Linking.openURL)) return;
  Alert.alert("Could not open WhatsApp", "Open the booking message thread on your phone.");
}

const styles = StyleSheet.create({
  panel: { gap: spacing(4) },
  actions: { gap: spacing(3) },
  primary: { minHeight: 52, borderRadius: radius.control, backgroundColor: colors.sageDeep, alignItems: "center", justifyContent: "center" },
  primaryText: { ...type.button, color: colors.white },
  secondary: { minHeight: 50, borderRadius: radius.control, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.mist },
  secondaryText: { ...type.button, color: colors.ink },
});
