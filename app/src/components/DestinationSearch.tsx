import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.section}>
      <Pressable style={styles.addRow} onPress={() => setExpanded(!expanded)}>
        <View style={styles.addIcon}><Ionicons name="add" size={18} color={colors.kopi} /></View>
        <View style={styles.addCopy}><Text style={styles.title}>Add a stop</Text><Text style={styles.help}>Bobo searches verified Google Places in Malaysia</Text></View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.inkSoft} />
      </Pressable>
      {expanded ? <SearchForm query={query} busy={busy} onChange={setQuery} onSearch={onSearch} /> : null}
      {results.map((place) => (
        <DestinationResult key={place.place_id} place={place} busy={busy} onAdd={onAdd} />
      ))}
    </View>
  );
}

function SearchForm(props: { query: string; busy: boolean; onChange: (value: string) => void; onSearch: (query: string) => Promise<void> }): React.ReactElement {
  const disabled = props.busy || props.query.trim().length < 2;
  return (
    <View style={styles.searchRow}>
      <TextInput value={props.query} onChangeText={props.onChange} placeholder="Museum, cafe, waterfall..." placeholderTextColor={colors.inkSoft} style={styles.input} returnKeyType="search" onSubmitEditing={() => { if (!disabled) void props.onSearch(props.query); }} />
      <Pressable style={[styles.searchButton, props.busy && styles.disabled]} disabled={disabled} onPress={() => void props.onSearch(props.query)}><Text style={styles.searchText}>Search</Text></Pressable>
    </View>
  );
}

function DestinationResult({ place, busy, onAdd }: { place: PlaceCandidate; busy: boolean; onAdd: (place: PlaceCandidate) => Promise<void> }): React.ReactElement {
  return (
    <View style={styles.result}>
      <PlaceImage placeId={place.place_id} placePhotoAvailable={place.place_photo_available} fallbackUrl={place.image_url} placeAttributions={place.place_photo_attributions} fallbackAttributions={place.image_attributions} style={styles.resultImage} />
      <View style={styles.resultBody}>
        <View style={styles.resultTop}>
          <View style={styles.resultText}><Text style={styles.name}>{place.name}</Text><Text style={styles.address} numberOfLines={2}>{place.address}</Text></View>
          <Pressable style={[styles.add, busy && styles.disabled]} disabled={busy} onPress={() => void onAdd(place)}><Text style={styles.addText}>Add</Text></Pressable>
        </View>
        <Text style={styles.activityLabel}>What to do</Text>
        <Text style={styles.activity}>{place.suggested_activity}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing(5), gap: spacing(3) },
  addRow: {
    minHeight: 72,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.sage,
    borderRadius: radius.card,
    padding: spacing(3),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: colors.card,
  },
  addIcon: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.kaya, alignItems: "center", justifyContent: "center" },
  addCopy: { flex: 1 },
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
    backgroundColor: colors.halo,
    justifyContent: "center",
    paddingHorizontal: spacing(4),
  },
  searchText: { ...type.button, color: colors.sageDeep },
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
