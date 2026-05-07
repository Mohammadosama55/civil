import { type Request, type Response } from "express";
import { Issue } from "../models/Complaint";
import {
  CreateIssueBody,
  UpdateIssueBody,
  GetIssueParams,
  UpdateIssueParams,
  DeleteIssueParams,
  UpvoteIssueParams,
  GetIssuesQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";
import { sendComplaintEmail } from "../utils/emailService";
import { logger } from "../lib/logger";

const UPVOTE_THRESHOLD = parseInt(process.env["UPVOTE_THRESHOLD"] ?? "2", 10);

export function formatComplaint(issue: InstanceType<typeof Issue>) {
  return {
    id: issue._id.toString(),
    title: issue.title,
    description: issue.description ?? null,
    category: issue.category,
    status: issue.status,
    location: issue.location,
    ward: (issue as any).ward ?? null,
    lat: issue.lat ?? null,
    lng: issue.lng ?? null,
    upvotes: issue.upvotes,
    upvotedBy: issue.upvotedBy ?? [],
    imageUrl: issue.imageUrl ?? null,
    reportedBy: issue.reportedBy?.toString() ?? null,
    reporterName: issue.reporterName ?? null,
    complaintEmailSent: (issue as any).complaintEmailSent ?? false,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  };
}

export async function listComplaints(req: Request, res: Response): Promise<void> {
  const query = GetIssuesQueryParams.safeParse(req.query);
  const filter: Record<string, unknown> = {};
  if (query.success) {
    if (query.data.category) filter["category"] = query.data.category;
    if (query.data.status) filter["status"] = query.data.status;
  }
  if (req.query["ward"]) filter["ward"] = req.query["ward"];

  const limit = parseInt(String(req.query["limit"] ?? "100"), 10);
  const offset = parseInt(String(req.query["offset"] ?? "0"), 10);

  const issues = await Issue.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit);
  res.json(issues.map(formatComplaint));
}

export async function getAlerts(_req: Request, res: Response): Promise<void> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [escalatedThisWeek, urgentOpen, totalOpen] = await Promise.all([
    Issue.countDocuments({ complaintEmailSent: true, createdAt: { $gte: weekAgo } }),
    Issue.countDocuments({ upvotes: { $gte: UPVOTE_THRESHOLD }, status: { $ne: "resolved" } }),
    Issue.countDocuments({ status: "open" }),
  ]);
  res.json({ escalatedThisWeek, urgentOpen, totalOpen, threshold: UPVOTE_THRESHOLD });
}

export async function getStats(_req: Request, res: Response): Promise<void> {
  const [total, open, inProgress, resolved] = await Promise.all([
    Issue.countDocuments(),
    Issue.countDocuments({ status: "open" }),
    Issue.countDocuments({ status: "in-progress" }),
    Issue.countDocuments({ status: "resolved" }),
  ]);
  const categoryAgg = await Issue.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ total, open, inProgress, resolved, categories: categoryAgg.map((c: any) => ({ name: c._id, count: c.count })) });
}

export async function getHeatmap(_req: Request, res: Response): Promise<void> {
  const issues = await Issue.find({ lat: { $ne: null }, lng: { $ne: null } }).select("lat lng status upvotes ward category");
  res.json(issues.map((i) => ({
    lat: i.lat,
    lng: i.lng,
    status: i.status,
    upvotes: i.upvotes,
    ward: (i as any).ward ?? null,
    category: i.category,
    intensity: i.status === "resolved" ? 0.3 : Math.min(1, 0.4 + i.upvotes * 0.1),
  })));
}

export async function getComplaint(req: Request, res: Response): Promise<void> {
  const params = GetIssueParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const issue = await Issue.findById(params.data.id).catch(() => null);
  if (!issue) { res.status(404).json({ error: "Complaint not found" }); return; }
  res.json(formatComplaint(issue));
}

export async function createComplaint(req: Request, res: Response): Promise<void> {
  const parsed = CreateIssueBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const authMw = requireAuth();
  let userId: string | null = null;
  let userName: string | null = null;
  try {
    await new Promise<void>((resolve) => { authMw(req, res, () => resolve()); });
    const user = (req as any).user;
    if (user) { userId = user._id.toString(); userName = user.username; }
  } catch {}

  const issue = await Issue.create({
    ...parsed.data,
    reportedBy: userId ?? undefined,
    reporterName: userName ?? parsed.data.reporterName ?? undefined,
  });

  if (userId) {
    const { User } = await import("../models/User");
    await User.findByIdAndUpdate(userId, { $inc: { issueCount: 1 } });
  }

  res.status(201).json(formatComplaint(issue));
}

export async function updateComplaint(req: Request, res: Response): Promise<void> {
  const params = UpdateIssueParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = UpdateIssueBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const issue = await Issue.findByIdAndUpdate(params.data.id, { $set: parsed.data }, { new: true }).catch(() => null);
  if (!issue) { res.status(404).json({ error: "Complaint not found" }); return; }
  res.json(formatComplaint(issue));
}

export async function deleteComplaint(req: Request, res: Response): Promise<void> {
  const params = DeleteIssueParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const issue = await Issue.findByIdAndDelete(params.data.id).catch(() => null);
  if (!issue) { res.status(404).json({ error: "Complaint not found" }); return; }
  res.sendStatus(204);
}

export async function upvoteComplaint(req: Request, res: Response): Promise<void> {
  const params = UpvoteIssueParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const voterKey = req.ip ?? req.headers["x-forwarded-for"] ?? "anon";
  const issue = await Issue.findById(params.data.id).catch(() => null);
  if (!issue) { res.status(404).json({ error: "Complaint not found" }); return; }

  const alreadyVoted = (issue.upvotedBy ?? []).includes(String(voterKey));
  if (alreadyVoted) { res.status(409).json({ error: "Already upvoted" }); return; }

  issue.upvotes += 1;
  issue.upvotedBy = [...(issue.upvotedBy ?? []), String(voterKey)];
  await issue.save();

  if (issue.upvotes >= UPVOTE_THRESHOLD && !(issue as any).complaintEmailSent) {
    logger.info({ issueId: issue._id.toString(), upvotes: issue.upvotes }, "Upvote threshold reached — sending complaint email");
    const sent = await sendComplaintEmail({
      issueId: issue._id.toString(),
      title: issue.title,
      description: issue.description ?? "",
      category: issue.category,
      location: issue.location,
      upvotes: issue.upvotes,
      reporterName: issue.reporterName ?? "Anonymous",
      createdAt: issue.createdAt.toISOString(),
      ward: (issue as any).ward ?? undefined,
    });
    if (sent) {
      await Issue.findByIdAndUpdate(issue._id, { complaintEmailSent: true });
    }
  }

  res.json(formatComplaint(issue));
}
