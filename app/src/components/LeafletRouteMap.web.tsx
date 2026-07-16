import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/trip-map.css";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { TripStop } from "@shared/trip";

export function LeafletRouteMap({ stops }: { stops: TripStop[] }): React.ReactElement {
  const positions = stops.map(position);
  return (
    <MapContainer center={positions[0] ?? [4.2105, 101.9758]} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {positions.length > 1 ? <Polyline positions={positions} pathOptions={{ color: "#52705E", weight: 5, opacity: 0.82 }} /> : null}
      {stops.map((stop, index) => (
        <CircleMarker key={stop.id} center={position(stop)} radius={15} pathOptions={{ color: "#FFFFFF", weight: 4, fillColor: index === 0 ? "#D0473C" : "#52705E", fillOpacity: 1 }}>
          <Tooltip permanent direction="center" className="jalan2-map-number">{index + 1}</Tooltip>
        </CircleMarker>
      ))}
      <FitRoute positions={positions} />
    </MapContainer>
  );
}

function FitRoute({ positions }: { positions: LatLngExpression[] }): null {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) map.setView(positions[0], 13);
    if (positions.length > 1) map.fitBounds(positions as LatLngBoundsExpression, { padding: [34, 34], maxZoom: 13 });
  }, [map, positions]);
  return null;
}

function position(stop: TripStop): [number, number] {
  return [stop.location.lat, stop.location.lng];
}
