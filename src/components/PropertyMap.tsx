import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix dos ícones default do Leaflet no Vite (caso contrário ficam quebrados).
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// @ts-expect-error - sobrescreve internals do leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

type Props = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  endereco?: string;
  height?: number;
};

export function PropertyMap({ latitude, longitude, endereco, height = 200 }: Props) {
  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  if (!hasCoords) {
    return (
      <div
        className="rounded-lg bg-white/5 backdrop-blur border border-white/10 flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        Localização não informada
      </div>
    );
  }

  const lat = latitude as number;
  const lng = longitude as number;
  const gmapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div
      className="rounded-lg overflow-hidden bg-white/5 backdrop-blur border border-white/10"
      style={{ height }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0a66c2", fontWeight: 600 }}
            >
              Abrir no Google Maps
            </a>
            {endereco && (
              <div style={{ marginTop: 4, fontSize: 12, color: "#444" }}>{endereco}</div>
            )}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
