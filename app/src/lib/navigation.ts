import type { Href } from "expo-router";

export const HOME_ROUTE = "/" as Href;

export const PRIMARY_TABS = [
  { name: "index", title: "Home" },
  { name: "discover", title: "Discover" },
  { name: "trips", title: "Trips" },
  { name: "you", title: "You" },
] as const;

export type PrimaryTabName = (typeof PRIMARY_TABS)[number]["name"];

export function activeTabForRouteName(routeName: string): PrimaryTabName {
  if (routeName === "menu/[id]") return "index";
  if (routeName === "directory" || routeName === "experience/[id]") return "discover";
  if (routeName === "trip/[id]" || routeName === "itinerary/[id]") return "trips";
  return PRIMARY_TABS.some(({ name }) => name === routeName)
    ? routeName as PrimaryTabName
    : "index";
}
