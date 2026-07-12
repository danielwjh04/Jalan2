import { z } from "zod";

export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type GeoPoint = z.infer<typeof GeoPointSchema>;

export const TripSourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
});

export const TripStopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  location: GeoPointSchema,
  image_url: z.string().url().nullable(),
  estimated_spend_myr: z.number().nonnegative().nullable(),
  duration_minutes: z.number().int().positive(),
  sources: z.array(TripSourceSchema).min(1),
});

export type TripStop = z.infer<typeof TripStopSchema>;

export const OptimizedRouteSchema = z.object({
  ordered_stop_ids: z.array(z.string().min(1)).min(2),
  distance_meters: z.number().nonnegative(),
  duration_minutes: z.number().int().nonnegative(),
  path: z.array(GeoPointSchema).min(2),
  provider: z.enum(["google", "offline"]),
});

export type OptimizedRoute = z.infer<typeof OptimizedRouteSchema>;

export const TripPlanSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    region: z.string().min(1),
    source_creator: z.string().min(1),
    source_url: z.string().url(),
    cover_url: z.string().nullable(),
    demo: z.literal(true),
    stops: z.array(TripStopSchema).min(2),
    selected_stop_ids: z.array(z.string().min(1)).min(2),
    route: OptimizedRouteSchema.nullable(),
  })
  .superRefine((trip, context) => {
    const stopIds = new Set(trip.stops.map((stop) => stop.id));
    if (stopIds.size !== trip.stops.length) {
      context.addIssue({
        code: "custom",
        path: ["stops"],
        message: "Stop ids must be unique",
      });
    }
    if (
      new Set(trip.selected_stop_ids).size !== trip.selected_stop_ids.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["selected_stop_ids"],
        message: "Selected stop ids must be unique",
      });
    }
    for (const id of trip.selected_stop_ids) {
      if (!stopIds.has(id)) {
        context.addIssue({
          code: "custom",
          path: ["selected_stop_ids"],
          message: `Unknown selected stop ${id}`,
        });
      }
    }
  });

export type TripPlan = z.infer<typeof TripPlanSchema>;

const EARTH_RADIUS_METERS = 6_371_000;

function radians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineMeters(from: GeoPoint, to: GeoPoint): number {
  const latDelta = radians(to.lat - from.lat);
  const lngDelta = radians(to.lng - from.lng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(lngDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

export function optimizeStopOrder(
  stops: TripStop[],
  startId: string,
): string[] {
  const byId = new Map(stops.map((stop) => [stop.id, stop]));
  const start = byId.get(startId);
  if (!start) throw new Error(`Unknown start stop ${startId}`);
  const remaining = stops.filter((stop) => stop.id !== startId);
  const ordered = [start];
  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let nearestIndex = 0;
    for (let index = 1; index < remaining.length; index += 1) {
      const candidate = haversineMeters(
        current.location,
        remaining[index].location,
      );
      const nearest = haversineMeters(
        current.location,
        remaining[nearestIndex].location,
      );
      if (candidate < nearest) nearestIndex = index;
    }
    ordered.push(remaining.splice(nearestIndex, 1)[0]);
  }
  return ordered.map((stop) => stop.id);
}
