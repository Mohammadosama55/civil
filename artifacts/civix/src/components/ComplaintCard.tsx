import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ThumbsUp, MapPin, Calendar, Tag, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

interface Complaint {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  location: string;
  ward?: string | null;
  upvotes: number;
  reporterName?: string | null;
  complaintEmailSent?: boolean;
  createdAt: string;
}

interface ComplaintCardProps {
  complaint: Complaint;
  onUpvote?: (id: string) => void;
  showActions?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "in-progress": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function ComplaintCard({ complaint, onUpvote, showActions = true }: ComplaintCardProps) {
  const [, navigate] = useLocation();

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/complaints/${complaint.id}`)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{complaint.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[complaint.status] ?? ""}`}>
            {complaint.status}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {complaint.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{complaint.description}</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{complaint.location}</span>
          <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{complaint.category}</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(complaint.createdAt).toLocaleDateString()}
          </span>
        </div>

        {complaint.ward && (
          <Badge variant="outline" className="text-xs">{complaint.ward}</Badge>
        )}

        {complaint.complaintEmailSent && (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            Escalated to ward officer
          </div>
        )}

        {showActions && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              by {complaint.reporterName ?? "Anonymous"}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={(e) => { e.stopPropagation(); onUpvote?.(complaint.id); }}
            >
              <ThumbsUp className="h-3 w-3" />
              {complaint.upvotes}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
