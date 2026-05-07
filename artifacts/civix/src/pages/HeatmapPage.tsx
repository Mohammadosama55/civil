import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, CheckCircle2, AlertTriangle, Activity } from "lucide-react";
import Layout from "@/components/layout/Layout";

interface HeatPoint {
  lat: number;
  lng: number;
  status: string;
  upvotes: number;
  ward?: string | null;
  category?: string;
  intensity: number;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function HeatmapLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap();
  const circlesRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    circlesRef.current.forEach((c) => c.remove());
    circlesRef.current = [];

    points.forEach((pt) => {
      const isResolved = pt.status === "resolved";
      const isUrgent = pt.upvotes >= 3;

      let color = "#3b82f6";
      if (isResolved) color = "#10b981";
      else if (isUrgent) color = "#ef4444";
      else if (pt.upvotes >= 2) color = "#f59e0b";

      const radius = Math.max(14, Math.min(50, 14 + pt.upvotes * 8));

      [0.08, 0.15, 0.3].forEach((opacity, i) => {
        const glowR = radius * (1.8 - i * 0.4);
        const glow = L.circleMarker([pt.lat, pt.lng], {
          radius: glowR,
          fillColor: color,
          fillOpacity: opacity,
          stroke: false,
        }).addTo(map);
        circlesRef.current.push(glow);
      });

      const core = L.circleMarker([pt.lat, pt.lng], {
        radius: 7,
        fillColor: color,
        fillOpacity: 0.95,
        color: "#fff",
        weight: 1.5,
      })
        .bindPopup(
          `<b>${pt.category ?? "Issue"}</b><br/>
           Ward: ${pt.ward ?? "—"}<br/>
           Upvotes: ${pt.upvotes}<br/>
           Status: ${pt.status}`
        )
        .addTo(map);
      circlesRef.current.push(core);
    });

    return () => { circlesRef.current.forEach((c) => c.remove()); };
  }, [points, map]);

  return null;
}

export default function HeatmapPage() {
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/issues/heatmap`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setPoints(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const resolved = points.filter((p) => p.status === "resolved").length;
  const urgent = points.filter((p) => p.upvotes >= 3 && p.status !== "resolved").length;
  const open = points.filter((p) => p.status === "open").length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Flame className="h-7 w-7 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Accountability Heatmap</h1>
            <p className="text-muted-foreground text-sm">Live view of civic complaints across all wards</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div><p className="text-2xl font-bold">{points.length}</p><p className="text-xs text-muted-foreground">Total on map</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div><p className="text-2xl font-bold">{urgent}</p><p className="text-xs text-muted-foreground">Urgent</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div><p className="text-2xl font-bold">{resolved}</p><p className="text-xs text-muted-foreground">Resolved</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { label: "Resolved", color: "#10b981" },
            { label: "Moderate (1–2 upvotes)", color: "#f59e0b" },
            { label: "Urgent (3+ upvotes)", color: "#ef4444" },
            { label: "Reported", color: "#3b82f6" },
          ].map(({ label, color }) => (
            <Badge key={label} variant="outline" className="gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {label}
            </Badge>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border shadow-sm" style={{ height: "520px" }}>
            <MapContainer center={[24.8607, 67.0011]} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <HeatmapLayer points={points} />
            </MapContainer>
          </div>
        )}

        {open > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {open} open complaint{open !== 1 ? "s" : ""} awaiting resolution across all wards
          </p>
        )}
      </div>
    </Layout>
  );
}
