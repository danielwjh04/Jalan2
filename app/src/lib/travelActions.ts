import { Alert, Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { TripStop } from "@shared/trip";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { isTiomanStop } from "@/lib/tiomanMobility";
import { destinationLabel, isGooglePlaceId } from "@/lib/travelLeg";

export const GRAB_BOOKING_URL = "https://grab.onelink.me/2695613898?af_ad=my&af_adset=grab_website&af_channel=transport&af_dp=grab%3A%2F%2Fopen%3FscreenType%3DBOOKING&af_force_deeplink=true&af_sub1=book_ride&af_web_dp=https%3A%2F%2Fwww.grab.com%2Fmy%2Fdownload%2F&c=organic_web&is_retargeting=true&pid=organic_web";

export async function openDirections(stop: TripStop): Promise<void> {
  const destination = `${stop.location.lat},${stop.location.lng}`;
  if (isTiomanStop(stop)) {
    const search = new URLSearchParams({ api: "1", query: destination });
    if (await tryOpenExternalUrl(`https://www.google.com/maps/search/?${search.toString()}`, Linking.openURL)) return;
    Alert.alert("Could not open map", "Try Google Maps again later.");
    return;
  }
  const params = new URLSearchParams({ api: "1", destination, travelmode: "driving", dir_action: "navigate" });
  if (isGooglePlaceId(stop.place_id)) params.set("destination_place_id", stop.place_id!);
  if (await tryOpenExternalUrl(`https://www.google.com/maps/dir/?${params.toString()}`, Linking.openURL)) return;
  Alert.alert("Could not open directions", "Try Google Maps again later.");
}

export async function openGrab(destination: TripStop): Promise<void> {
  await Clipboard.setStringAsync(destinationLabel(destination));
  if (await tryOpenExternalUrl(GRAB_BOOKING_URL, Linking.openURL)) return;
  Alert.alert("Could not open Grab", "The destination address was copied. Paste it into Grab when the app is available.");
}
