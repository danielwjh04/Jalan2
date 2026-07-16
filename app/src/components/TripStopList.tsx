import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { isTransportStop, type TripPlan, type TripStop } from "@shared/trip";
import { colors, spacing, type } from "@/lib/theme";
import { EasybookTransitionCard } from "./EasybookTransitionCard";
import { TripOriginCard } from "./TripOriginCard";
import { TripStopCard } from "./TripStopCard";
import { TravelLegConnector } from "./TravelLegConnector";

interface Props {
  trip: TripPlan;
  selected: string[];
  editable: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TripStopList(props: Props): React.ReactElement {
  const ordered = selectedStops(props.trip, props.selected);
  const available = props.trip.stops.filter((stop) => !props.selected.includes(stop.id));
  const startsWithTransport = ordered[0] ? isTransportStop(ordered[0]) : false;
  let placePosition = startsWithTransport ? 1 : 0;
  return (
    <View>
      <Text style={styles.section}>Your itinerary</Text>
      {startsWithTransport ? <TripOriginCard name={routeLabels(ordered[0]).from} /> : null}
      {ordered.map((stop, index) => {
        if (isTransportStop(stop)) return <TransportTransition key={stop.id} {...props} stop={stop} ordered={ordered} index={index} />;
        const position = placePosition;
        placePosition += 1;
        const next = ordered[index + 1];
        const leg = next && !isTransportStop(next)
          ? props.trip.planning?.legs.find((candidate) => candidate.from_stop_id === stop.id && candidate.to_stop_id === next.id)
          : undefined;
        return (
          <Fragment key={stop.id}>
            <TripStopCard stop={stop} position={position} isLast={!next} canRemove={props.selected.length > 2} editable={props.editable} onToggle={() => props.onToggle(stop.id)} onDelete={() => props.onDelete(stop.id)} />
            {next && !isTransportStop(next) ? <TravelLegConnector key={`${stop.id}-${next.id}`} from={stop} to={next} leg={leg} /> : null}
          </Fragment>
        );
      })}
      {available.length ? <Text style={styles.section}>Available places</Text> : null}
      {available.map((stop) => <TripStopCard key={stop.id} stop={stop} position={null} isLast canRemove onToggle={() => props.onToggle(stop.id)} onDelete={() => props.onDelete(stop.id)} />)}
    </View>
  );
}

function TransportTransition(props: Props & { stop: TripStop; ordered: TripStop[]; index: number }): React.ReactElement {
  const labels = routeLabels(props.stop);
  const previous = [...props.ordered.slice(0, props.index)].reverse().find((stop) => !isTransportStop(stop));
  const next = props.ordered[props.index + 1];
  return <EasybookTransitionCard stop={props.stop} from={previous?.name ?? labels.from} to={labels.to} nextStop={next?.name} editable={props.editable} onRemove={() => props.onToggle(props.stop.id)} />;
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
});
