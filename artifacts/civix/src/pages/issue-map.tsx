import { Layout } from "@/components/layout/Layout";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useGetIssues } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Link } from "wouter";

// Need to import leafet CSS dynamically to prevent SSR issues if we had them
import "leaflet/dist/leaflet.css";

// Fix leaflet icon issues
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function IssueMap() {
  const [category, setCategory] = useState<string>("all");
  
  const { data: issues, isLoading } = useGetIssues(
    category !== "all" ? { category } : {}
  );

  const getStatusIcon = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open': return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case 'in-progress': return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      case 'resolved': return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      default: return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  return (
    <Layout>
      <div className="flex flex-col w-full h-[calc(100vh-64px)]">
        
        {/* Map Header / Filters */}
        <div className="bg-white dark:bg-slate-950 border-b border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Civic Issue Map</h1>
              <p className="text-xs text-slate-500 font-medium">Real-time reports in your area</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[200px] bg-slate-50 dark:bg-slate-900" data-testid="select-map-category">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="sanitation">Sanitation</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 w-full relative z-0">
          <MapContainer 
            center={[40.7128, -74.0060]} 
            zoom={13} 
            scrollWheelZoom={true} 
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {issues?.map(issue => {
              if (issue.lat && issue.lng) {
                return (
                  <Marker key={issue.id} position={[issue.lat, issue.lng]}>
                    <Popup className="civix-popup">
                      <div className="p-1 min-w-[200px]">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-sm text-slate-900 leading-tight">{issue.title}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{issue.description}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${
                            issue.status === 'open' ? 'bg-red-100 text-red-700' :
                            issue.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {issue.status}
                          </span>
                          <span className="text-xs font-semibold text-primary">{issue.upvotes} upvotes</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </MapContainer>
        </div>

        {/* Recent Issues List (Bottom panel) */}
        <div className="h-1/3 min-h-[250px] bg-white dark:bg-slate-950 border-t border-border overflow-hidden flex flex-col shrink-0">
          <div className="p-3 border-b border-border bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300">Recent Reports</h2>
            <span className="text-xs font-medium text-slate-500">{issues?.length || 0} issues found</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : issues?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No issues reported in this category yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {issues?.map(issue => (
                  <div key={issue.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-4 hover:border-primary/50 transition-colors shadow-sm cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {issue.imageUrl ? (
                        <img src={issue.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getStatusIcon(issue.status)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{issue.title}</h4>
                      <p className="text-xs text-slate-500 truncate mb-2">{issue.location}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{issue.upvotes} votes</span>
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