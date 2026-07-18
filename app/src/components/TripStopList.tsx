import { Fragment, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { isTransportStop, type TripPlan, type TripStop } from "@shared/trip";
import { colors, spacing, type } from "@/lib/theme";
import { formatDuration } from "@/lib/travelLeg";
import { ActionButton } from "./ActionButton";
import { EasybookTransitionCard } from "./EasybookTransitionCard";
import { TripOrderEditor } from "./TripOrderEditor";
import { TripOriginCard } from "./TripOriginCard";
import { TripStopCard } from "./TripStopCard";
import { TravelLegConnector } from "./TravelLegConnector";

interface Props {
  trip: TripPlan;
  selected: string[];
  editable: boolean;
  busy: boolean;
  onReorder: (ids: string[]) => Promise<void>;
  onOptimize: () => Promise<void>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TripStopList(props: Props): React.ReactElement {
  const [reordering, setReordering] = useState(false);
  const ordered = selectedStops(props.trip, props.selected);
  const available = props.trip.stops.filter((stop) => !props.selected.includes(stop.id));
  const startsWithTransport = ordered[0] ? isTransportStop(ordered[0]) : false;
  const days = props.trip.planning?.days ?? [];
  const dayByStop = new Map(days.flatMap((day) => day.stop_ids.map((id) => [id, day] as const)));
  const firstStopByDay = new Map(days.map((day) => [day.day, day.stop_ids[0]]));
  const hasDriverPlan = props.trip.planning?.legs.some(
    (leg) => leg.provider === "operator" && leg.booking === "operator_request" && !/rafting lorry|rafting operator|uphill/i.test(leg.explanation),
  );
  let placePosition = startsWithTransport ? 1 : 0;
  return (
    <View>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Your itinerary</Text>
        {props.editable ? (
          <View style={styles.tools}>
            <ActionButton
              variant="tonal"
              label="Reorder"
              style={styles.tool}
              accessibilityState={{ expanded: reordering }}
              onPress={() => setReordering((value) => !value)}
            />
            <ActionButton variant="tonal" label="Optimise" style={styles.tool} onPress={() => void props.onOptimize()} />
          </View>
        ) : null}
      </View>
      {props.editable && reordering ? (
        <TripOrderEditor stops={props.trip.stops} selected={props.selected} busy={props.busy} onReorder={props.onReorder} />
      ) : null}
      {startsWithTransport ? <TripOriginCard name={routeLabels(ordered[0]).from} /> : null}
      {hasDriverPlan ? <DriverPlanCard /> : null}
      {ordered.map((stop, index) => {
        const day = dayByStop.get(stop.id);
        const dayHeader = day && firstStopByDay.get(day.day) === stop.id
          ? <DayHeader day={day.day} minutes={day.estimated_minutes} stopIds={day.stop_ids} />
          : null;
        if (isTransportStop(stop)) {
          return (
            <Fragment key={stop.id}>
              {dayHeader}
              <TransportTransition {...props} stop={stop} ordered={ordered} index={index} />
            </Fragment>
          );
        }
        const position = placePosition;
        placePosition += 1;
        const next = ordered[index + 1];
        const leg = next && !isTransportStop(next)
          ? props.trip.planning?.legs.find((candidate) => candidate.from_stop_id === stop.id && candidate.to_stop_id === next.id)
          : undefined;
        return (
          <Fragment key={stop.id}>
            {dayHeader}
            <TripStopCard stop={stop} position={position} isLast={!next} canRemove={props.selected.length > 2} editable={props.editable} onToggle={() => props.onToggle(stop.id)} onDelete={() => props.onDelete(stop.id)} />
            {next && !isTransportStop(next) ? <TravelLegConnector key={`${stop.id}-${next.id}`} from={stop} to={next} leg={leg} /> : null}
          </Fragment>
        );
      })}
      {available.length ? <Text style={styles.section}>Available places</Text> : null}
      {available.map((stop) => <TripStopCard key={stop.id} stop={stop} position={null} isLast canRemove editable={props.editable} onToggle={() => props.onToggle(stop.id)} onDelete={() => props.onDelete(stop.id)} />)}
    </View>
  );
}

function DriverPlanCard(): React.ReactElement {
  return (
    <View style={styles.driverPlan}>
      <Text style={styles.driverEyebrow}>LOCAL TRANSPORT CHOICE</Text>
      <Text style={styles.driverTitle}>Use Grab per leg, or bundle a driver</Text>
      <Text style={styles.driverCopy}>
        Every normal road transfer opens Grab with the next destination pin. A hired driver is only an optional alternative for luggage, early pickups or lower-coverage Gopeng legs.
      </Text>
    </View>
  );
}

function DayHeader({ day, minutes, stopIds }: { day: number; minutes: number; stopIds: string[] }): React.ReactElement {
  return (
    <View style={styles.dayHeader}>
      <View>
        <Text style={styles.dayEyebrow}>DAY {day}</Text>
        <Text style={styles.dayTitle}>{dayTitle(stopIds)}</Text>
      </View>
      <Text style={styles.dayTime}>{formatDuration(minutes)} planned</Text>
    </View>
  );
}

function dayTitle(stopIds: string[]): string {
  if (stopIds.includes("kl-ipoh-intercity")) return "KL to Ipoh · old town food and night park";
  if (stopIds.includes("gopeng-rafting")) return "Gopeng rafting · Ipoh food trail";
  if (stopIds.includes("ipoh-kl-intercity")) return "Heritage and tea valley · return to KL";
  return "Your planned stops";
}

function TransportTransition(props: Props & { stop: TripStop; ordered: TripStop[]; index: number }): React.ReactElement {
  const labels = routeLabels(props.stop);
  const previous = [...props.ordered.slice(0, props.index)].reverse().find((stop) => !isTransportStop(stop));
  const next = props.ordered[props.index + 1];
  return <EasybookTransitionCard stop={props.stop} from={previous?.name ?? labels.from} to={labels.to} nextStop={next} editable={props.editable} onRemove={() => props.onToggle(props.stop.id)} />;
}

function selectedStops(trip: TripPlan, selected: string[]): TripStop[] {
  const byId = new Map(trip.stops.map((stop) => [stop.id, stop]));
  return selected.map((id) => byId.get(id)).filter((stop): stop is TripStop => Boolean(stop));
}

function routeLabels(stop: TripStop): { from: string; to: string } {
  if (stop.transport_from && stop.transport_to) return { from: stop.transport_from, to: stop.transport_to };
  const route = stop.name.replace(/^EasyBook:\s*/i, "").split(/\s+to\s+/i);
  const from = route[0]?.trim() || "Previous place";
  const to = route[1]?.trim() || stop.address || "Next place";
  return { from: from.toUpperCase() === "KL" ? "Kuala Lumpur (TBS)" : from, to };
}

const styles = StyleSheet.create({
  section: { ...type.title, color: colors.ink, marginTop: spacing(2), marginBottom: spacing(3) },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing(2), marginTop: spacing(2), marginBottom: spacing(3) },
  sectionTitle: { ...type.title, color: colors.ink },
  tools: { flexDirection: "row", gap: spacing(2) },
  tool: { minHeight: 36, paddingHorizontal: spacing(3) },
  driverPlan: {
    marginBottom: spacing(4),
    padding: spacing(3.5),
    borderRadius: 18,
    backgroundColor: colors.halo,
    gap: spacing(1),
  },
  driverEyebrow: { ...type.caption, color: colors.sageDeep, letterSpacing: 1 },
  driverTitle: { ...type.heading, color: colors.ink },
  driverCopy: { ...type.body, color: colors.inkSoft },
  dayHeader: {
    marginTop: spacing(4),
    marginBottom: spacing(3),
    paddingTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.mist,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing(3),
  },
  dayEyebrow: { ...type.caption, color: colors.kaya, letterSpacing: 1.2 },
  dayTitle: { ...type.heading, color: colors.ink },
  dayTime: { ...type.caption, color: colors.inkSoft },
});
