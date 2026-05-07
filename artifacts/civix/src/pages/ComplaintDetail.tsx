import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetIssue, useUpvoteIssue } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, MapPin, Tag, Calendar, User, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import MapView from "@/components/MapView";

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
  open: { label: "Open", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  "in-progress": { label: "In Progress", class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  resolved: { label: "Resolved", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [upvoted, setUpvoted] = useState(false);

  const { data: complaint, isLoading, refetch } = useGetIssue(id ?? "");
  const { mutate: upvote, isPending } = useUpvoteIssue();

  const handleUpvote = () => {
    if (!id || upvoted) return;
    upvote(
      { id },
      {
        onSuccess: () => { setUpvoted(true); refetch(); toast({ title: "Upvoted!", description: "Your vote has been recorded." }); },
        onError: (err: any) => toast({ title: "Could not upvote", description: err?.message ?? "Already voted or an error occurred.", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!complaint) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Complaint not found</h2>
          <p className="text-muted-foreground mb-6">This complaint may have been removed or the link is incorrect.</p>
          <Button onClick={() => navigate("/issue-map")}>Back to Issue Map</Button>
        </div>
      </Layout>
    );
  }

  const statusStyle = STATUS_STYLES[complaint.status] ?? { label: complaint.status, class: "" };
  const hasPin = complaint.lat != null && complaint.lng != null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/issue-map")}>
          <ArrowLeft className="h-4 w-4" /> Back to issues
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <CardTitle className="text-xl leading-tight">{complaint.title}</CardTitle>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusStyle.class}`}>
                {statusStyle.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{complaint.location}</span>
              <span className="flex items-center gap-1.5"><Tag className="h-4 w-4" />{complaint.category}</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(complaint.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              {complaint.reporterName && (
                <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{complaint.reporterName}</span>
              )}
            </div>

            {complaint.ward && <Badge variant="outline" className="w-fit">{complaint.ward}</Badge>}
          </CardHeader>

          <Separator />

          <CardContent className="pt-4 space-y-4">
            {complaint.description ? (
              <p className="text-sm leading-relaxed">{complaint.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description provided.</p>
            )}

            {complaint.imageUrl && (
              <img src={complaint.imageUrl} alt="Complaint" className="rounded-lg w-full max-h-64 object-cover border" />
            )}

            {complaint.complaintEmailSent && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Formal complaint letter has been sent to the ward officer.
              </div>
            )}

            {complaint.status === "resolved" && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                This issue has been marked as resolved by the ward administration.
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">{complaint.upvotes} community upvote{complaint.upvotes !== 1 ? "s" : ""}</span>
              <Button onClick={handleUpvote} disabled={upvoted || isPending} className="gap-2">
                <ThumbsUp className="h-4 w-4" />
                {upvoted ? "Upvoted" : "Upvote this issue"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasPin && (
          <Card>
            <CardHeader><CardTitle className="text-base">Location on Map</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-lg">
              <MapView
                complaints={[{ id: complaint.id, title: complaint.title, status: complaint.status, location: complaint.location, category: complaint.category, upvotes: complaint.upvotes, lat: complaint.lat, lng: complaint.lng }]}
                center={[complaint.lat!, complaint.lng!]}
                zoom={15}
                height="300px"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
