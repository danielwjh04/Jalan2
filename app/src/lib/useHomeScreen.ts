import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import type { DiscoveryCard, FixtureCard } from "@shared/api";
import { normalizeVideoUrl } from "@shared/videoUrl";
import { getDiscoveries, getFixtures } from "./api";
import { ingestVideo } from "./ingest";
import { scanMenu, type MenuSource } from "./menu";

interface HomeScreenState {
  prefill: string;
  busy: boolean;
  discoveries: DiscoveryCard[];
  fixtures: FixtureCard[];
  submit: (raw: string) => void;
  chooseMenuSource: () => void;
}

export function useHomeScreen(): HomeScreenState {
  const [prefill, setPrefill] = useState("");
  const [busy, setBusy] = useState(false);
  const [discoveries, setDiscoveries] = useState<DiscoveryCard[]>([]);
  const [fixtures, setFixtures] = useState<FixtureCard[]>([]);
  useEffect(() => {
    Promise.all([getDiscoveries(), getFixtures()])
      .then(([nextDiscoveries, nextFixtures]) => {
        setDiscoveries(nextDiscoveries);
        setFixtures(nextFixtures);
      })
      .catch(() => {
        setDiscoveries([]);
        setFixtures([]);
      });
  }, []);
  useFocusEffect(useCallback(() => {
    void Clipboard.getStringAsync()
      .then((text) => { if (normalizeVideoUrl(text)) setPrefill(text); })
      .catch(() => undefined);
  }, []));
  const submit = (raw: string): void => {
    setBusy(true);
    ingestVideo(raw)
      .catch((cause: unknown) => Alert.alert("Could not start", String(cause)))
      .finally(() => setBusy(false));
  };
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
  return { prefill, busy, discoveries, fixtures, submit, chooseMenuSource };
}
