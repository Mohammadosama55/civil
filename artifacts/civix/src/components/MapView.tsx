import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const STATUS_ICON_COLOR: Record<string, string> = {
  open: "#ef4444",
  "in-progress": "#f59e0b",
  resolved: "#10b981",
};

function makeIcon(status: string) {
  const color = STATUS_ICON_COLOR[status] ?? "#6366f1";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

export interface MapComplaint {
  id: string;
  title: string;
  status: string;
  location: string;
  category: string;
  upvotes: number;
  lat?: number | null;
  lng?: number | null;
}

interface MapViewProps {
  complaints: MapComplaint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (id: string) => void;
}

export default function MapView({ complaints, center = [24.8607, 67.0011], zoom = 12, height = "400px", onMarkerClick }: MapViewProps) {
  const pinnable = complaints.filter((c) => c.lat != null && c.lng != null);

  return (
    <MapContainer center={center} zoom={zoom} style={{ height, width: "100%" }} className="rounded-lg z-0">
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} zoom={zoom} />
      {pinnable.map((c) => (
        <Marker
          key={c.id}
          position={[c.lat!, c.lng!]}
          icon={makeIcon(c.status)}
          eventHandlers={{ click: () => onMarkerClick?.(c.id) }}
        >
          <Popup>
            <div className="text-sm space-y-1 min-w-[160px]">
              <p className="font-semibold">{c.title}</p>
              <p className="text-muted-foreground text-xs">{c.category} · {c.location}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs">{c.upvotes} upvotes</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: STATUS_ICON_COLOR[c.status] + "33", color: STATUS_ICON_COLOR[c.status] }}
                >
                  {c.status}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
