import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import type { DiscoveryCard } from "@shared/api";
import { normalizeVideoUrl } from "@shared/videoUrl";
import { getDiscoveries } from "./api";
import { scanMenu, type MenuSource } from "./menu";

interface HomeScreenState {
  prefill: string;
  busy: boolean;
  discoveries: DiscoveryCard[];
  chooseMenuSource: () => void;
  startMenuDemo: () => void;
}

export function useHomeScreen(): HomeScreenState {
  const [prefill, setPrefill] = useState("");
  const [busy, setBusy] = useState(false);
  const [discoveries, setDiscoveries] = useState<DiscoveryCard[]>([]);
  useEffect(() => {
    getDiscoveries().then(setDiscoveries).catch(() => setDiscoveries([]));
  }, []);
  useFocusEffect(useCallback(() => {
    void Clipboard.getStringAsync()
      .then((text) => { if (normalizeVideoUrl(text)) setPrefill(text); })
      .catch(() => undefined);
  }, []));
  const startMenuScan = (source: MenuSource): void => {
    setBusy(true);
    scanMenu(source)
      .catch((cause: unknown) => Alert.alert("Could not read menu", String(cause)))
      .finally(() => setBusy(false));
  };
  const chooseMenuSource = (): void => {
    Alert.alert("Scan a kopitiam menu", "Where is the menu photo?", [
      { text: "Take photo", onPress: () => startMenuScan("camera") },
      { text: "Pick from library", onPress: () => startMenuScan("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  };
  return { prefill, busy, discoveries, chooseMenuSource, startMenuDemo: () => startMenuScan("demo") };
}
