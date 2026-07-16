import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import type { TripStop } from "@shared/trip";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { isTiomanStop, TIOMAN_TRANSPORT_URL } from "@/lib/tiomanMobility";
import { colors, radius, spacing, type } from "@/lib/theme";

const GRAB_BOOKING_URL = "https://grab.onelink.me/2695613898?af_ad=my&af_adset=grab_website&af_channel=transport&af_dp=grab%3A%2F%2Fopen%3FscreenType%3DBOOKING&af_force_deeplink=true&af_sub1=book_ride&af_web_dp=https%3A%2F%2Fwww.grab.com%2Fmy%2Fdownload%2F&c=organic_web&is_retargeting=true&pid=organic_web";

export function StopTravelActions({ stop }: { stop: TripStop }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const onTioman = isTiomanStop(stop);
  const openGrab = async (): Promise<void> => {
    await Clipboard.setStringAsync(stop.address ?? stop.name);
    setCopied(true);
    if (await tryOpenExternalUrl(GRAB_BOOKING_URL, Linking.openURL)) return;
    Alert.alert("Could not open Grab", "The destination address was copied. Paste it into Grab when the app is available.");
  };
  return (
    <View style={styles.wrap}>
      <View style={styles.tip}><Text style={styles.tipLabel}>ASK LOCALLY</Text><Text style={styles.tipText}>{localQuestion(stop)}</Text></View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="link" style={styles.action} onPress={() => void openDirections(stop)}><Ionicons name={onTioman ? "map-outline" : "navigate-outline"} size={17} color={colors.sageDeep} /><Text style={styles.actionText}>{onTioman ? "View on map" : "Directions"}</Text></Pressable>
        {onTioman ? (
          <Pressable accessibilityRole="link" style={styles.action} onPress={() => void openUrl(TIOMAN_TRANSPORT_URL, "Tioman transport guide")}><Ionicons name="boat-outline" size={17} color={colors.sageDeep} /><Text style={styles.actionText}>Island transport</Text></Pressable>
        ) : (
          <Pressable accessibilityRole="link" style={styles.action} onPress={() => void openGrab()}><Ionicons name="car-outline" size={17} color={colors.sageDeep} /><Text style={styles.actionText}>{copied ? "Address copied" : "Open Grab"}</Text></Pressable>
        )}
        {stop.easybook_url ? <Pressable accessibilityRole="link" style={styles.action} onPress={() => void openUrl(stop.easybook_url, "EasyBook")}><Ionicons name="bus-outline" size={17} color={colors.sageDeep} /><Text style={styles.actionText}>EasyBook</Text></Pressable> : null}
      </View>
      {copied ? <Text style={styles.grabNote}>Exact address copied. Paste it into Grab's destination field.</Text> : null}
    </View>
  );
}

function localQuestion(stop: TripStop): string {
  if (isTiomanStop(stop)) return "Confirm the village, meeting jetty, total fare, weather policy, last return boat and whether pickup is included.";
  if (stop.primary_type === "restaurant" || stop.primary_type === "cafe") return "What do locals order here, what sells out first, and what should it cost today?";
  if (stop.primary_type === "tourist_attraction" || /div|raft|hike|atv|cave|waterfall/i.test(`${stop.name} ${stop.summary}`)) return "Confirm the meeting point, total price, equipment, weather policy, return time and whether pickup is included.";
  return "Confirm the exact entrance or meeting point, opening time, price, what is included and the best onward transport.";
}

async function openDirections(stop: TripStop): Promise<void> {
  const destination = `${stop.location.lat},${stop.location.lng}`;
  if (isTiomanStop(stop)) {
    const search = new URLSearchParams({ api: "1", query: destination });
    if (await tryOpenExternalUrl(`https://www.google.com/maps/search/?${search.toString()}`, Linking.openURL)) return;
    Alert.alert("Could not open map", "Try Google Maps again later.");
    return;
  }
  const params = new URLSearchParams({ api: "1", destination, travelmode: "driving", dir_action: "navigate" });
  if (stop.place_id && !stop.place_id.startsWith("source-")) params.set("destination_place_id", stop.place_id);
  if (await tryOpenExternalUrl(`https://www.google.com/maps/dir/?${params.toString()}`, Linking.openURL)) return;
  Alert.alert("Could not open directions", "Try Google Maps again later.");
}

async function openUrl(url: string | null | undefined, provider: string): Promise<void> {
  if (url && await tryOpenExternalUrl(url, Linking.openURL)) return;
  Alert.alert(`Could not open ${provider}`, `Try ${provider} again later.`);
}

const styles = StyleSheet.create({
  wrap: { gap: spacing(2) },
  tip: { gap: spacing(0.5), padding: spacing(2.5), borderRadius: radius.control, backgroundColor: colors.halo },
  tipLabel: { ...type.caption, color: colors.sageDeep, letterSpacing: 0.8 },
  tipText: { ...type.body, color: colors.ink },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5) },
  action: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: spacing(1), paddingHorizontal: spacing(2.5), borderRadius: radius.pill, backgroundColor: colors.canvas },
  actionText: { ...type.label, color: colors.sageDeep },
  grabNote: { ...type.caption, color: colors.inkSoft },
});
