import { StyleSheet, Text, View } from "react-native";
import type {
  TripReservationBatch,
  TripStopReservation,
} from "@shared/reservation";
import {
  reservationProgressLabel,
  reservationStatusLabel,
} from "@/lib/reservationPresentation";
import { colors, eyebrow, spacing, type } from "@/lib/theme";
import { SurfaceCard } from "./SurfaceCard";

export function ReservationProgressCard({
  batch,
}: {
  batch: TripReservationBatch;
}): React.ReactElement {
  return (
    <SurfaceCard style={styles.stack}>
      <Text style={styles.eyebrow}>RESERVATION PROGRESS</Text>
      <Text style={styles.title}>{reservationProgressLabel(batch.counts)}</Text>
      {batch.stops.map((stop) => (
        <View key={stop.id} style={styles.row}>
          <Text style={styles.label}>{stop.stopName}</Text>
          <Text style={statusStyle(stop)}>
            {reservationStatusLabel(stop.status, stop.eligibility)}
          </Text>
        </View>
      ))}
    </SurfaceCard>
  );
}

function statusStyle(stop: TripStopReservation) {
  return [
    styles.meta,
    stop.status === "CONFIRMED" && styles.confirmed,
    (stop.status === "FAILED" || stop.status === "DECLINED") && styles.error,
  ];
}

const styles = StyleSheet.create({
  stack: { gap: spacing(3) },
  eyebrow: { ...eyebrow },
  title: { ...type.title, color: colors.ink },
  label: { ...type.label, color: colors.ink },
  meta: { ...type.caption, color: colors.inkSoft },
  confirmed: { color: colors.confirm },
  error: { color: colors.danger },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing(3),
    paddingTop: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
});
