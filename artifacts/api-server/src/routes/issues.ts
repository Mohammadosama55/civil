import { Router, type IRouter } from "express";
import { Issue } from "../models/Issue";
import {
  CreateIssueBody,
  UpdateIssueBody,
  GetIssueParams,
  UpdateIssueParams,
  DeleteIssueParams,
  UpvoteIssueParams,
  GetIssuesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatIssue(issue: InstanceType<typeof Issue>) {
  return {
    id: issue._id.toString(),
    title: issue.title,
    description: issue.description ?? null,
    category: issue.category,
    status: issue.status,
    location: issue.location,
    lat: issue.lat ?? null,
    lng: issue.lng ?? null,
    upvotes: issue.upvotes,
    imageUrl: issue.imageUrl ?? null,
    reportedBy: issue.reportedBy?.toString() ?? null,
    reporterName: issue.reporterName ?? null,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  };
}

router.get("/issues", async (req, res): Promise<void> => {
  const query = GetIssuesQueryParams.safeParse(req.query);
  const filter: Record<string, unknown> = {};
  if (query.success) {
    if (query.data.category) filter["category"] = query.data.category;
    if (query.data.status) filter["status"] = query.data.status;
  }

  const limit = parseInt(String(req.query["limit"] ?? "50"), 10);
  const offset = parseInt(String(req.query["offset"] ?? "0"), 10);

  const issues = await Issue.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit);
  res.json(issues.map(formatIssue));
});

router.get("/issues/stats", async (_req, res): Promise<void> => {
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

  const categories = categoryAgg.map((c: { _id: string; count: number }) => ({ name: c._id, count: c.count }));

  res.json({ total, open, inProgress, resolved, categories });
});

router.get("/issues/:id", async (req, res): Promise<void> => {
  const params = GetIssueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const issue = await Issue.findById(params.data.id).catch(() => null);
  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }
  res.json(formatIssue(issue));
});

router.post("/issues", async (req, res): Promise<void> => {
  const parsed = CreateIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const issue = await Issue.create(parsed.data);
  res.status(201).json(formatIssue(issue));
});

router.patch("/issues/:id", async (req, res): Promise<void> => {
  const params = UpdateIssueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const parsed = UpdateIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const issue = await Issue.findByIdAndUpdate(params.data.id, { $set: parsed.data }, { new: true }).catch(() => null);
  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }
  res.json(formatIssue(issue));
});

router.delete("/issues/:id", async (req, res): Promise<void> => {
  const params = DeleteIssueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const issue = await Issue.findByIdAndDelete(params.data.id).catch(() => null);
  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/issues/:id/upvote", async (req, res): Promise<void> => {
  const params = UpvoteIssueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const issue = await Issue.findByIdAndUpdate(
    params.data.id,
    { $inc: { upvotes: 1 } },
    { new: true }
  ).catch(() => null);
  if (!issue) {
    res.status(404).json({ error: "Issue not found" });
    return;
  }
  res.json(formatIssue(issue));
});

export default router;
