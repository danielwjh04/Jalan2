import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { TripStop } from "@shared/trip";
import { tryOpenExternalUrl } from "@/lib/externalLink";
import { isTiomanStop } from "@/lib/tiomanMobility";
import { destinationLabel, isGooglePlaceId } from "@/lib/travelLeg";
import { grabBookingUrl } from "@/lib/grabLink";

export async function openDirections(stop: TripStop): Promise<void> {
  const destination = `${stop.location.lat},${stop.location.lng}`;
  if (isTiomanStop(stop)) {
    const search = new URLSearchParams({ api: "1", query: destination });
    if (await tryOpenExternalUrl(`https://www.google.com/maps/search/?${search.toString()}`)) return;
    Alert.alert("Could not open map", "Try Google Maps again later.");
    return;
  }
  const params = new URLSearchParams({ api: "1", destination, travelmode: "driving", dir_action: "navigate" });
  if (isGooglePlaceId(stop.place_id)) params.set("destination_place_id", stop.place_id!);
  if (await tryOpenExternalUrl(`https://www.google.com/maps/dir/?${params.toString()}`)) return;
  Alert.alert("Could not open directions", "Try Google Maps again later.");
}

export async function openGrab(destination: TripStop): Promise<void> {
  await Clipboard.setStringAsync(destinationLabel(destination));
  if (await tryOpenExternalUrl(grabBookingUrl(destination))) return;
  Alert.alert("Could not open Grab", "The destination address was copied. Paste it into Grab when the app is available.");
}
