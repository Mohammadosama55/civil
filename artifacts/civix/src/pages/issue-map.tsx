import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import { useGetIssues, useUpvoteIssue, useCreateIssue } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertCircle, Clock, CheckCircle2, Plus, ThumbsUp, X, Layers, Mail } from "lucide-react";
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

  const params: Record<string, string> = {};
  if (category !== "all") params["category"] = category;
  if (statusFilter !== "all") params["status"] = statusFilter;
  if (ward !== "all") params["ward"] = ward;

  const { data: issues, isLoading, refetch } = useGetIssues(params);
  const upvoteMutation = useUpvoteIssue();
  const createMutation = useCreateIssue();

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

  const heatmapIssues = issues?.filter(i => i.lat && i.lng) ?? [];

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
            <Button size="sm" variant={showHeatmap ? "default" : "outline"} className="h-8 text-xs gap-1.5" onClick={() => setShowHeatmap(p => !p)}>
              <Layers className="w-3.5 h-3.5" /> Heatmap
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
            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> Click on the map below to pin the exact location, then fill in details.</p>
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
                  <span className="text-xs text-primary font-medium flex items-center gap-1"><MapPin className="w-3 h-3" /> {pickedLat.toFixed(4)}, {pickedLng?.toFixed(4)}</span>
                ) : (
                  <span className="text-xs text-slate-400 italic">No pin selected yet</span>
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

            {/* Heatmap circles */}
            {showHeatmap && heatmapIssues.map(issue => (
              <Circle
                key={`heat-${issue.id}`}
                center={[issue.lat!, issue.lng!]}
                radius={300}
                pathOptions={{
                  fillColor: issue.status === "resolved" ? "#10b981" : issue.upvotes >= STATUS_THRESHOLD ? "#ef4444" : "#f59e0b",
                  fillOpacity: 0.35,
                  stroke: false,
                }}
              />
            ))}

            {/* Picked pin */}
            {pickedLat && pickedLng && (
              <Marker position={[pickedLat, pickedLng]}>
                <Popup><div className="text-xs font-semibold text-primary">New Issue Pin</div></Popup>
              </Marker>
            )}

            {/* Issue markers */}
            {!showHeatmap && issues?.map(issue => {
              if (!issue.lat || !issue.lng) return null;
              return (
                <Marker key={issue.id} position={[issue.lat, issue.lng]}>
                  <Popup maxWidth={260}>
                    <div className="p-1 min-w-[220px]">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">{issue.title}</h3>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          issue.status === "open" ? "bg-red-100 text-red-700" :
                          issue.status === "in-progress" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>{issue.status}</span>
                      </div>
                      {issue.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{issue.description}</p>}
                      <div className="text-[11px] text-slate-500 mb-2">{issue.location}{issue.ward ? ` · ${issue.ward}` : ""}</div>
                      {issue.imageUrl && <img src={issue.imageUrl} alt="" className="w-full h-24 object-cover rounded mb-2" />}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <ThumbsUp className="w-3 h-3 text-primary" />
                          <span className="font-semibold text-primary">{issue.upvotes}</span>
                          <span className="text-slate-400">/ {STATUS_THRESHOLD} threshold</span>
                        </div>
                        {(issue as any).complaintEmailSent && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold"><Mail className="w-3 h-3" />Sent</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleUpvote(issue.id, issue.upvotes)}
                        disabled={votedIds.has(issue.id)}
                        className={`mt-2 w-full text-xs font-semibold py-1.5 rounded transition-colors ${
                          votedIds.has(issue.id)
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                        }`}
                      >
                        {votedIds.has(issue.id) ? "Voted" : "Upvote this issue"}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Heatmap legend */}
          {showHeatmap && (
            <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-900 border border-border rounded-xl shadow-lg p-3 z-[1000] text-xs space-y-1.5">
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Heatmap Legend</p>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-red-400 opacity-80" />Urgent (≥{STATUS_THRESHOLD} upvotes)</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-amber-400 opacity-80" />Reported</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-emerald-400 opacity-80" />Resolved</div>
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
                  <div key={issue.id} className="shrink-0 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-primary/50 transition-colors shadow-sm">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {getStatusIcon(issue.status)}
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate flex-1">{issue.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{issue.location}</p>
                      {issue.ward && <p className="text-[11px] text-primary font-medium">{issue.ward}</p>}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                      <div className="flex items-center gap-1">
                        {(issue as any).complaintEmailSent && <Mail className="w-3 h-3 text-emerald-500" />}
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
