import type { TripStop } from "@shared/trip";

const GRAB_ONELINK_URL = "https://grab.onelink.me/2695613898";

export function grabBookingUrl(destination: TripStop): string {
  const dropOff = new URLSearchParams({
    screenType: "BOOKING",
    dropOffLatitude: String(destination.location.lat),
    dropOffLongitude: String(destination.location.lng),
    dropOffAddress: destination.address ?? destination.name,
  });
  const link = new URL(GRAB_ONELINK_URL);
  link.search = new URLSearchParams({
    af_ad: "my",
    af_adset: "jalan2_itinerary",
    af_channel: "transport",
    af_dp: `grab://open?${dropOff.toString()}`,
    af_force_deeplink: "true",
    af_sub1: "book_ride",
    af_web_dp: "https://www.grab.com/my/download/",
    c: "jalan2",
    is_retargeting: "true",
    pid: "jalan2",
  }).toString();
  return link.toString();
}
