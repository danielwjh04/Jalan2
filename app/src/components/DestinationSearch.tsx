import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { PlaceCandidate } from "@shared/trip";
import { colors, radius, spacing, type } from "@/lib/theme";
import { PlaceImage } from "./PlaceImage";

interface Props {
  results: PlaceCandidate[];
  busy: boolean;
  onSearch: (query: string) => Promise<void>;
  onAdd: (place: PlaceCandidate) => Promise<void>;
}

export function DestinationSearch({ results, busy, onSearch, onAdd }: Props): React.ReactElement {
  const [query, setQuery] = useState("");
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Add any destination</Text>
      <Text style={styles.help}>Search verified Google Places results in Malaysia.</Text>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Museum, cafe, waterfall..."
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => void onSearch(query)}
        />
        <Pressable
          style={[styles.searchButton, busy && styles.disabled]}
          disabled={busy || query.trim().length < 2}
          onPress={() => void onSearch(query)}
        >
          <Text style={styles.searchText}>Search</Text>
        </Pressable>
      </View>
      {results.map((place) => (
        <View key={place.place_id} style={styles.result}>
          <PlaceImage
            placeId={place.place_id}
            placePhotoAvailable={place.place_photo_available}
            fallbackUrl={place.image_url}
            placeAttributions={place.place_photo_attributions}
            fallbackAttributions={place.image_attributions}
            style={styles.resultImage}
          />
          <View style={styles.resultBody}>
            <View style={styles.resultTop}>
              <View style={styles.resultText}>
                <Text style={styles.name}>{place.name}</Text>
                <Text style={styles.address} numberOfLines={2}>{place.address}</Text>
              </View>
              <Pressable style={styles.add} onPress={() => void onAdd(place)}>
                <Text style={styles.addText}>Add</Text>
              </Pressable>
            </View>
            <Text style={styles.activityLabel}>What to do</Text>
            <Text style={styles.activity}>{place.suggested_activity}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing(6), gap: spacing(2) },
  title: { ...type.title, color: colors.ink },
  help: { ...type.caption, color: colors.inkSoft },
  searchRow: { flexDirection: "row", gap: spacing(2) },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    color: colors.ink,
    paddingHorizontal: spacing(3),
  },
  searchButton: {
    borderRadius: radius.control,
    backgroundColor: colors.kaya,
    justifyContent: "center",
    paddingHorizontal: spacing(4),
  },
  searchText: { ...type.button, color: colors.kopi },
  disabled: { opacity: 0.45 },
  result: {
    backgroundColor: colors.card,
    borderRadius: radius.control,
    overflow: "hidden",
  },
  resultImage: { width: "100%", height: 148 },
  resultBody: { padding: spacing(3), gap: spacing(1) },
  resultTop: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  resultText: { flex: 1 },
  name: { ...type.heading, color: colors.ink },
  address: { ...type.caption, color: colors.inkSoft, marginTop: spacing(1) },
  activityLabel: { ...type.label, color: colors.sageDeep, marginTop: spacing(1) },
  activity: { ...type.caption, color: colors.inkSoft },
  add: { backgroundColor: colors.halo, borderRadius: radius.control, padding: spacing(3) },
  addText: { ...type.label, color: colors.sageDeep },
});
