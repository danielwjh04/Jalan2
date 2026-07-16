import { createElement, useRef, type CSSProperties, type DragEvent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TripStop } from '@shared/trip';
import { colors, eyebrow, radius, spacing, type } from '@/lib/theme';
import { SurfaceCard } from './SurfaceCard';

interface Props {
  stops: TripStop[];
  selected: string[];
  busy: boolean;
  onReorder: (ids: string[]) => Promise<void>;
}

export function TripOrderEditor(props: Props): React.ReactElement {
  const dragged = useRef<string | null>(null);
  const ordered = orderedStops(props.stops, props.selected);
  const move = (fromId: string, toId: string): void => {
    if (fromId === toId) return;
    const next = [...props.selected];
    const from = next.indexOf(fromId);
    const to = next.indexOf(toId);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, fromId);
    void props.onReorder(next);
  };
  return (
    <SurfaceCard style={styles.card}>
      <View><Text style={styles.eyebrow}>ROUTE ORDER</Text><Text style={styles.title}>Drag stops into your day</Text></View>
      <Text style={styles.help}>Manual changes clear the old route. Drop a stop anywhere, then optimize to recalculate every leg and run the end-to-end critic.</Text>
      <View style={styles.list}>{ordered.map((stop, index) => {
        const dragProps = {
          draggable: !props.busy,
          onDragStart: (event: DragEvent<HTMLDivElement>) => { dragged.current = stop.id; event.dataTransfer.effectAllowed = 'move'; },
          onDragOver: (event: DragEvent<HTMLDivElement>) => event.preventDefault(),
          onDrop: (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); if (dragged.current) move(dragged.current, stop.id); dragged.current = null; },
          onDragEnd: () => { dragged.current = null; },
          role: 'listitem',
          'aria-label': `Drag ${stop.name} to reorder`,
          style: { ...styles.row, display: 'flex', cursor: 'grab' } as CSSProperties,
        };
        return createElement('div', { key: stop.id, ...dragProps },
          <Ionicons name="reorder-three" size={22} color={colors.inkSoft} />,
          <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>,
          <Text numberOfLines={2} style={styles.name}>{stop.name}</Text>,
          <Text style={styles.dragLabel}>Drag</Text>,
        );
      })}</View>
    </SurfaceCard>
  );
}

function orderedStops(stops: TripStop[], ids: string[]): TripStop[] {
  const byId = new Map(stops.map((stop) => [stop.id, stop]));
  return ids.map((id) => byId.get(id)).filter((stop): stop is TripStop => Boolean(stop));
}

const styles = StyleSheet.create({
  card: { gap: spacing(3) },
  eyebrow: { ...eyebrow },
  title: { ...type.title, color: colors.ink },
  help: { ...type.caption, color: colors.inkSoft },
  list: { gap: spacing(1.5) },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing(2), borderRadius: radius.control, backgroundColor: colors.canvas, padding: spacing(2) },
  number: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.halo },
  numberText: { ...type.label, color: colors.sageDeep },
  name: { ...type.label, color: colors.ink, flex: 1 },
  dragLabel: { ...type.caption, color: colors.inkSoft },
});
