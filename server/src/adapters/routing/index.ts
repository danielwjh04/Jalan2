import type { Config } from "../../config";
import { NotConfiguredError } from "../../lib/errors";
import { createGoogleRouting } from "./google";
import { createOfflineRouting } from "./offline";
import type { RoutingProvider } from "./types";

export function createRouting(config: Config): RoutingProvider {
  if (config.ROUTING_PROVIDER === "offline") return createOfflineRouting();
  if (config.ROUTING_PROVIDER === "auto") {
    return config.GOOGLE_MAPS_API_KEY
      ? createGoogleRouting(config.GOOGLE_MAPS_API_KEY)
      : createOfflineRouting();
  }
  if (!config.GOOGLE_MAPS_API_KEY) {
    throw new NotConfiguredError(
      "Google Routes",
      "Set GOOGLE_MAPS_API_KEY or use ROUTING_PROVIDER=offline.",
    );
  }
  return createGoogleRouting(config.GOOGLE_MAPS_API_KEY);
}
