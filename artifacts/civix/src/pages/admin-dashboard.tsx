import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, CheckCircle2, Clock, AlertCircle, FileText, Users, BarChart2, Mail, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

interface DashboardData {
  ward: string;
  stats: { total: number; open: number; inProgress: number; resolved: number };
  categories: { name: string; count: number }[];
  recentIssues: {
    id: string; title: string; category: string; status: string;
    location: string; ward: string | null; upvotes: number;
    complaintEmailSent: boolean; reporterName: string | null; createdAt: string;
  }[];
}

function fetchDashboard(): Promise<DashboardData> {
  return fetch("/api/admin/dashboard", { credentials: "include" }).then(r => {
    if (!r.ok) throw new Error("Unauthorized");
    return r.json();
  });
}

function patchStatus(id: string, status: string) {
  return fetch(`/api/admin/issues/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); });
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "open" ? "bg-red-100 text-red-700 border-red-200" :
    status === "in-progress" ? "bg-amber-100 text-amber-700 border-amber-200" :
    "bg-emerald-100 text-emerald-700 border-emerald-200";
  const Icon = status === "open" ? AlertCircle : status === "in-progress" ? Clock : CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${cls}`}>
      <Icon className="w-3 h-3" />{status}
    </span>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusEditing, setStatusEditing] = useState<Record<string, string>>({});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchDashboard,
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => patchStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-dashboard"] }); toast({ title: "Status updated" }); },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="w-16 h-16 text-slate-300" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Restricted</h1>
          <p className="text-slate-500">Please log in to access the admin dashboard.</p>
          <Button asChild><Link href="/login">Log In</Link></Button>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="w-16 h-16 text-red-300" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Not Authorized</h1>
          <p className="text-slate-500">Ward admin access is required. Contact your administrator to upgrade your role.</p>
          <Button variant="outline" asChild><Link href="/">Go Home</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ward Admin Dashboard</h1>
              {isLoading ? <Skeleton className="h-4 w-32 mt-1" /> : (
                <p className="text-sm text-slate-500">{data?.ward} · Logged in as <span className="font-semibold text-primary">{user.username}</span></p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 self-start" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Complaints", value: data?.stats.total, icon: BarChart2, color: "text-slate-600" },
            { label: "Open", value: data?.stats.open, icon: AlertCircle, color: "text-red-500" },
            { label: "In Progress", value: data?.stats.inProgress, icon: Clock, color: "text-amber-500" },
            { label: "Resolved", value: data?.stats.resolved, icon: CheckCircle2, color: "text-emerald-500" },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                {isLoading ? <Skeleton className="h-6 w-12 mt-1" /> : <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value ?? 0}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        {!isLoading && data?.categories && data.categories.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 mb-8">
            <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />Issues by Category</h2>
            <div className="flex flex-wrap gap-3">
              {data.categories.map(c => (
                <div key={c.name} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">{c.name}</span>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issues table */}
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Recent Complaints
            </h2>
            <span className="text-xs text-slate-500">{data?.recentIssues.length ?? 0} shown</span>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : data?.recentIssues.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No complaints in your ward yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Issue</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ward</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Upvotes</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Update</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.recentIssues.map(issue => (
                    <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">{issue.title}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[180px]">{issue.location}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full capitalize">{issue.category}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{issue.ward ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${issue.upvotes >= 2 ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>{issue.upvotes}</span>
                      </td>
                      <td className="px-4 py-3">
                        {issue.complaintEmailSent ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><Mail className="w-3 h-3" />Sent</span>
                        ) : (
                          <span className="text-xs text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                      <td className="px-4 py-3">
                        <Select
                          value={statusEditing[issue.id] ?? issue.status}
                          onValueChange={v => {
                            setStatusEditing(p => ({ ...p, [issue.id]: v }));
                            statusMutation.mutate({ id: issue.id, status: v });
                          }}
                        >
                          <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 px-2"
                          onClick={() => window.open(`/api/admin/issues/${issue.id}/pdf`, "_blank")}
                        >
                          <FileText className="w-3 h-3" />PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
