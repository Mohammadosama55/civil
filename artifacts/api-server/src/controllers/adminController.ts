import { type Request, type Response } from "express";
import { Issue } from "../models/Complaint";
import { User } from "../models/User";
import { generateComplaintPDF } from "../utils/pdfGenerator";

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const admin = (req as any).dbUser;
  const wardFilter = admin.ward ? { ward: admin.ward } : {};

  const [total, open, inProgress, resolved, recentIssues] = await Promise.all([
    Issue.countDocuments(wardFilter),
    Issue.countDocuments({ ...wardFilter, status: "open" }),
    Issue.countDocuments({ ...wardFilter, status: "in-progress" }),
    Issue.countDocuments({ ...wardFilter, status: "resolved" }),
    Issue.find(wardFilter).sort({ createdAt: -1 }).limit(20),
  ]);

  const categoryAgg = await Issue.aggregate([
    { $match: wardFilter },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    ward: admin.ward ?? "All Wards",
    stats: { total, open, inProgress, resolved },
    categories: categoryAgg.map((c: any) => ({ name: c._id, count: c.count })),
    recentIssues: recentIssues.map((issue) => ({
      id: issue._id.toString(),
      title: issue.title,
      category: issue.category,
      status: issue.status,
      location: issue.location,
      ward: (issue as any).ward ?? null,
      upvotes: issue.upvotes,
      complaintEmailSent: (issue as any).complaintEmailSent ?? false,
      reporterName: issue.reporterName ?? null,
      createdAt: issue.createdAt.toISOString(),
    })),
  });
}

export async function updateComplaintStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body as { status: string };

  if (!["open", "in-progress", "resolved"].includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }

  const admin = (req as any).dbUser;
  const issue = await Issue.findById(id).catch(() => null);
  if (!issue) { res.status(404).json({ error: "Complaint not found" }); return; }

  if (admin.ward && (issue as any).ward && (issue as any).ward !== admin.ward) {
    res.status(403).json({ error: "This complaint is not in your ward" }); return;
  }

  issue.status = status;
  await issue.save();
  res.json({ id: issue._id.toString(), status: issue.status, updatedAt: issue.updatedAt.toISOString() });
}

export async function downloadComplaintPDF(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const issue = await Issue.findById(id).catch(() => null);
  if (!issue) { res.status(404).json({ error: "Complaint not found" }); return; }

  const pdf = generateComplaintPDF({
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

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="complaint-${issue._id.toString().slice(-8)}.pdf"`);
  res.send(pdf);
}

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await User.find({}, "-password").sort({ createdAt: -1 }).limit(50);
  res.json(users.map((u) => ({
    id: u._id.toString(),
    username: u.username,
    email: u.email,
    name: u.name ?? null,
    role: u.role,
    ward: (u as any).ward ?? null,
    issueCount: u.issueCount,
    createdAt: u.createdAt.toISOString(),
  })));
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { role, ward } = req.body as { role: string; ward?: string };

  if (!["citizen", "ward_admin"].includes(role)) {
    res.status(400).json({ error: "Invalid role" }); return;
  }

  const user = await User.findByIdAndUpdate(id, { role, ward: ward ?? null }, { new: true, select: "-password" }).catch(() => null);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ id: user._id.toString(), role: user.role, ward: (user as any).ward ?? null });
}
