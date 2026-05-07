import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import { useGetIssues, useUpvoteIssue, useCreateIssue } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, AlertCircle, Clock, CheckCircle2, Plus, ThumbsUp, X, Layers, Mail, Flame, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

const WARDS = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];
const CATEGORIES = ["infrastructure", "sanitation", "safety", "environment", "other"];
const STATUS_THRESHOLD = 2;

interface HeatPoint {
  lat: number;
  lng: number;
  status: string;
  upvotes: number;
  intensity: number;
  ward?: string | null;
  category?: string;
}

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "open": return <AlertCircle className="w-4 h-4 text-red-500" />;
    case "in-progress": return <Clock className="w-4 h-4 text-amber-500" />;
    case "resolved": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    default: return <MapPin className="w-4 h-4 text-slate-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "open": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "in-progress": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    case "resolved": return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getHeatColor(point: HeatPoint): string {
  if (point.status === "resolved") return "#10b981";
  if (point.upvotes >= STATUS_THRESHOLD * 3) return "#7c3aed";
  if (point.upvotes >= STATUS_THRESHOLD * 2) return "#dc2626";
  if (point.upvotes >= STATUS_THRESHOLD) return "#ef4444";
  return "#f59e0b";
}

function getHeatRadius(point: HeatPoint): number {
  if (point.status === "resolved") return 250;
  const base = 180;
  const bonus = Math.min(point.upvotes * 60, 500);
  return base + bonus;
}

function getHeatOpacity(point: HeatPoint): number {
  if (point.status === "resolved") return 0.22;
  return Math.min(0.55, 0.25 + point.upvotes * 0.06);
}

export default function IssueMap() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState("all");
  const [ward, setWard] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pickedLat, setPickedLat] = useState<number | null>(null);
  const [pickedLng, setPickedLng] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "infrastructure", ward: "Ward 1", location: "", imageUrl: "" });
  const [submitting, setSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [heatData, setHeatData] = useState<HeatPoint[]>([]);
  const [heatLoading, setHeatLoading] = useState(false);

  const params: Record<string, string> = {};
  if (category !== "all") params["category"] = category;
  if (statusFilter !== "all") params["status"] = statusFilter;
  if (ward !== "all") params["ward"] = ward;

  const { data: issues, isLoading, refetch } = useGetIssues(params);
  const upvoteMutation = useUpvoteIssue();
  const createMutation = useCreateIssue();

  useEffect(() => {
    if (!showHeatmap) return;
    setHeatLoading(true);
    fetch("/api/issues/heatmap", { credentials: "include" })
      .then(r => r.json())
      .then((pts: HeatPoint[]) => setHeatData(pts))
      .catch(() => setHeatData([]))
      .finally(() => setHeatLoading(false));
  }, [showHeatmap]);

  const handleUpvote = async (id: string, currentVotes: number) => {
    if (votedIds.has(id)) { toast({ title: "Already voted", description: "You've already upvoted this issue." }); return; }
    try {
      await upvoteMutation.mutateAsync({ id });
      setVotedIds(prev => new Set([...prev, id]));
      refetch();
      const newVotes = currentVotes + 1;
      if (newVotes >= STATUS_THRESHOLD) {
        toast({ title: "🚨 Threshold reached!", description: "A formal complaint letter has been sent to the ward officer.", className: "border-primary" });
      } else {
        toast({ title: "Upvoted!", description: `${newVotes} / ${STATUS_THRESHOLD} votes to trigger complaint.` });
      }
    } catch {
      toast({ title: "Error", description: "Could not upvote.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location) { toast({ title: "Required fields missing", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      await createMutation.mutateAsync({
        data: {
          ...form,
          lat: pickedLat ?? undefined,
          lng: pickedLng ?? undefined,
          reporterName: user?.username ?? "Anonymous",
        },
      });
      toast({ title: "Issue reported!", description: "Your complaint has been added to the map." });
      setShowForm(false);
      setForm({ title: "", description: "", category: "infrastructure", ward: "Ward 1", location: "", imageUrl: "" });
      setPickedLat(null);
      setPickedLng(null);
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to submit issue.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const urgentCount = issues?.filter(i => i.upvotes >= STATUS_THRESHOLD && i.status !== "resolved").length ?? 0;
  const resolvedCount = issues?.filter(i => i.status === "resolved").length ?? 0;

  return (
    <Layout>
      <div className="flex flex-col w-full" style={{ height: "calc(100vh - 64px)" }}>
        {/* Header */}
        <div className="bg-white dark:bg-slate-950 border-b border-border px-4 py-3 flex flex-wrap items-center gap-3 z-10 shrink-0">
          <div className="flex items-center gap-2 mr-2">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Civic Issue Map</h1>
              <p className="text-[11px] text-slate-500">Click map to pin location when reporting</p>
            </div>
          </div>

          {/* Quick stats */}
          {!isLoading && (
            <div className="hidden sm:flex items-center gap-3 mr-2">
              <div className="flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded-lg">
                <Flame className="w-3 h-3" />{urgentCount} urgent
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded-lg">
                <CheckCircle2 className="w-3 h-3" />{resolvedCount} resolved
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 flex-1 items-center">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={ward} onValueChange={setWard}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Ward" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                {WARDS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant={showHeatmap ? "default" : "outline"}
              className={`h-8 text-xs gap-1.5 ${showHeatmap ? "bg-orange-500 hover:bg-orange-600 border-orange-500 text-white" : ""}`}
              onClick={() => setShowHeatmap(p => !p)}
            >
              <Layers className="w-3.5 h-3.5" /> {showHeatmap ? "Heatmap On" : "Heatmap"}
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowForm(p => !p)}>
              {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showForm ? "Cancel" : "Report Issue"}
            </Button>
          </div>
        </div>

        {/* Report Form Panel */}
        {showForm && (
          <div className="bg-slate-50 dark:bg-slate-900 border-b border-border p-4 z-10 shrink-0">
            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              <span>Click on the map below to pin the exact location, then fill in the details.</span>
            </p>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input placeholder="Issue title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-9 text-sm" required />
              <Input placeholder="Location address *" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="h-9 text-sm" required />
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.ward} onValueChange={v => setForm(f => ({ ...f, ward: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WARDS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="Description of the issue..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="h-9 text-sm sm:col-span-2 resize-none" rows={1} />
              <Input placeholder="Image URL (optional)" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="h-9 text-sm" />
              <div className="flex items-center gap-2">
                {pickedLat ? (
                  <span className="text-xs text-primary font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {pickedLat.toFixed(4)}, {pickedLng?.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-xs text-amber-500 italic flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Click map to pin
                  </span>
                )}
              </div>
              <Button type="submit" disabled={submitting} className="h-9 text-sm">
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative z-0 min-h-0">
          <MapContainer center={[24.8607, 67.0011]} zoom={12} scrollWheelZoom className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {showForm && <LocationPicker onPick={(lat, lng) => { setPickedLat(lat); setPickedLng(lng); }} />}

            {/* Heatmap circles — layered for glow effect */}
            {showHeatmap && !heatLoading && heatData.map((point, i) => {
              const color = getHeatColor(point);
              const radius = getHeatRadius(point);
              const opacity = getHeatOpacity(point);
              return (
                <React.Fragment key={`heat-${i}`}>
                  {/* outer glow */}
                  <Circle
                    center={[point.lat, point.lng]}
                    radius={radius * 1.8}
                    pathOptions={{ fillColor: color, fillOpacity: opacity * 0.3, stroke: false }}
                  />
                  {/* mid ring */}
                  <Circle
                    center={[point.lat, point.lng]}
                    radius={radius * 1.1}
                    pathOptions={{ fillColor: color, fillOpacity: opacity * 0.55, stroke: false }}
                  />
                  {/* core */}
                  <Circle
                    center={[point.lat, point.lng]}
                    radius={radius * 0.45}
                    pathOptions={{ fillColor: color, fillOpacity: Math.min(opacity * 1.1, 0.85), stroke: true, color, weight: 1, opacity: 0.4 }}
                  />
                </React.Fragment>
              );
            })}

            {/* Picked pin */}
            {pickedLat && pickedLng && (
              <Marker position={[pickedLat, pickedLng]}>
                <Popup><div className="text-xs font-semibold text-primary">📍 New Issue Pin</div></Popup>
              </Marker>
            )}

            {/* Issue markers — always shown */}
            {issues?.map(issue => {
              if (!issue.lat || !issue.lng) return null;
              return (
                <Marker key={issue.id} position={[issue.lat, issue.lng]}>
                  <Popup maxWidth={270}>
                    <div className="p-1 min-w-[230px]">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">{issue.title}</h3>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          issue.status === "open" ? "bg-red-100 text-red-700" :
                          issue.status === "in-progress" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>{issue.status}</span>
                      </div>
                      {issue.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{issue.description}</p>}
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>{issue.location}{issue.ward ? ` · ${issue.ward}` : ""}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize mb-2">{issue.category}</div>
                      {issue.imageUrl && <img src={issue.imageUrl} alt="" className="w-full h-24 object-cover rounded mb-2" />}

                      {/* Upvote progress bar */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-500 font-medium">Community Support</span>
                          <span className="text-[10px] font-bold text-primary">{issue.upvotes}/{STATUS_THRESHOLD}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${issue.upvotes >= STATUS_THRESHOLD ? "bg-emerald-500" : "bg-primary"}`}
                            style={{ width: `${Math.min(100, (issue.upvotes / STATUS_THRESHOLD) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                        {(issue as any).complaintEmailSent && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold"><Mail className="w-3 h-3" />Complaint sent</span>
                        )}
                        {!(issue as any).complaintEmailSent && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400"><TrendingUp className="w-3 h-3" />Needs {Math.max(0, STATUS_THRESHOLD - issue.upvotes)} more vote{Math.max(0, STATUS_THRESHOLD - issue.upvotes) !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleUpvote(issue.id, issue.upvotes)}
                        disabled={votedIds.has(issue.id)}
                        className={`mt-2 w-full text-xs font-semibold py-1.5 rounded-lg transition-all ${
                          votedIds.has(issue.id)
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-primary/10 text-primary hover:bg-primary hover:text-white active:scale-95"
                        }`}
                      >
                        {votedIds.has(issue.id) ? "✓ Voted" : "👍 Upvote this issue"}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Heatmap legend */}
          {showHeatmap && (
            <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-900 border border-border rounded-xl shadow-xl p-4 z-[1000] text-xs space-y-2 min-w-[180px]">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                <Layers className="w-3.5 h-3.5 text-orange-500" /> Heatmap Legend
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-purple-600 opacity-90 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">Critical (≥{STATUS_THRESHOLD * 3} votes)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-red-600 opacity-90 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">Urgent (≥{STATUS_THRESHOLD * 2} votes)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-red-400 opacity-90 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">Active (≥{STATUS_THRESHOLD} votes)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-amber-400 opacity-90 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">Reported</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500 opacity-90 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">Resolved</span>
              </div>
              <div className="border-t border-border pt-2 mt-1 text-[10px] text-slate-400">
                Larger circle = more upvotes
              </div>
              {heatLoading && <div className="text-[10px] text-slate-400 animate-pulse">Loading heatmap data…</div>}
              {!heatLoading && <div className="text-[10px] text-slate-400">{heatData.length} issue{heatData.length !== 1 ? "s" : ""} plotted</div>}
            </div>
          )}

          {/* Heatmap top bar */}
          {showHeatmap && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg z-[1000] flex items-center gap-1.5">
              <Flame className="w-3 h-3" /> Heatmap Active — circle size reflects issue severity
            </div>
          )}
        </div>

        {/* Bottom issues list */}
        <div className="h-52 bg-white dark:bg-slate-950 border-t border-border flex flex-col shrink-0">
          <div className="px-4 py-2 border-b border-border bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300">Recent Reports</h2>
            <span className="text-xs text-slate-500">{issues?.length ?? 0} issues</span>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            {isLoading ? (
              <div className="flex gap-3 p-3 h-full items-center">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-56 shrink-0 rounded-xl" />)}
              </div>
            ) : issues?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No issues found. Be the first to report one!</div>
            ) : (
              <div className="flex gap-3 p-3 h-full">
                {issues?.map(issue => (
                  <div key={issue.id} className="shrink-0 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all shadow-sm">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {getStatusIcon(issue.status)}
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate flex-1">{issue.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{issue.location}</p>
                      {issue.ward && <p className="text-[11px] text-primary font-medium">{issue.ward}</p>}
                      {issue.description && <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{issue.description}</p>}
                    </div>
                    <div>
                      {/* Mini progress bar */}
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden my-1.5">
                        <div
                          className={`h-full rounded-full ${issue.upvotes >= STATUS_THRESHOLD ? "bg-emerald-500" : "bg-primary"}`}
                          style={{ width: `${Math.min(100, (issue.upvotes / STATUS_THRESHOLD) * 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                        <div className="flex items-center gap-1.5">
                          {(issue as any).complaintEmailSent && <Mail className="w-3 h-3 text-emerald-500" title="Complaint sent" />}
                          <button
                            onClick={() => handleUpvote(issue.id, issue.upvotes)}
                            disabled={votedIds.has(issue.id)}
                            className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                              votedIds.has(issue.id)
                                ? "text-slate-400"
                                : "text-primary hover:bg-primary/10"
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />{issue.upvotes}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}


