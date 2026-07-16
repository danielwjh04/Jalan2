import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TripStop } from '@shared/trip';
import { colors, eyebrow, radius, spacing, type } from '@/lib/theme';
import { SurfaceCard } from './SurfaceCard';

interface Props {
  stops: TripStop[];
  selected: string[];
  busy: boolean;
  onReorder: (ids: string[]) => Promise<void>;
  onOptimize: () => Promise<void>;
}

export function TripOrderEditor(props: Props): React.ReactElement {
  const ordered = orderedStops(props.stops, props.selected);
  const move = (index: number, offset: number): void => {
    const target = index + offset;
    if (target < 0 || target >= props.selected.length) return;
    const next = [...props.selected];
    [next[index], next[target]] = [next[target], next[index]];
    void props.onReorder(next);
  };
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>ROUTE ORDER</Text><Text style={styles.title}>Arrange your day</Text></View><OptimizeButton busy={props.busy} onPress={() => void props.onOptimize()} /></View>
      <Text style={styles.help}>Use the arrows to move a stop. Optimize recalculates the route and runs the final reasonableness check.</Text>
      <View style={styles.list}>{ordered.map((stop, index) => <View key={stop.id} style={styles.row}><View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View><Text numberOfLines={2} style={styles.name}>{stop.name}</Text><Pressable accessibilityLabel={`Move ${stop.name} earlier`} disabled={index === 0 || props.busy} style={styles.move} onPress={() => move(index, -1)}><Ionicons name="chevron-up" size={18} color={colors.sageDeep} /></Pressable><Pressable accessibilityLabel={`Move ${stop.name} later`} disabled={index === ordered.length - 1 || props.busy} style={styles.move} onPress={() => move(index, 1)}><Ionicons name="chevron-down" size={18} color={colors.sageDeep} /></Pressable></View>)}</View>
    </SurfaceCard>
  );
}

function OptimizeButton({ busy, onPress }: { busy: boolean; onPress: () => void }): React.ReactElement {
  return <Pressable accessibilityRole="button" disabled={busy} style={styles.optimize} onPress={onPress}><Ionicons name="sparkles" size={17} color={colors.kopi} /><Text style={styles.optimizeText}>{busy ? 'Checking…' : 'Optimize'}</Text></Pressable>;
}

function orderedStops(stops: TripStop[], ids: string[]): TripStop[] {
  const byId = new Map(stops.map((stop) => [stop.id, stop]));
  return ids.map((id) => byId.get(id)).filter((stop): stop is TripStop => Boolean(stop));
}

const styles = StyleSheet.create({
  card: { gap: spacing(3) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing(3) },
  eyebrow: { ...eyebrow },
  title: { ...type.title, color: colors.ink },
  help: { ...type.caption, color: colors.inkSoft },
  list: { gap: spacing(1.5) },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing(2), borderRadius: radius.control, backgroundColor: colors.canvas, padding: spacing(2) },
  number: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.halo },
  numberText: { ...type.label, color: colors.sageDeep },
  name: { ...type.label, color: colors.ink, flex: 1 },
  move: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control, backgroundColor: colors.card },
  optimize: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), paddingHorizontal: spacing(3), borderRadius: radius.control, backgroundColor: colors.kaya },
  optimizeText: { ...type.label, color: colors.kopi },
});
