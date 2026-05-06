import { Router, type IRouter } from "express";
import { User } from "../models/User";
import { GetContributorsQueryParams, GetContributorParams } from "@workspace/api-zod";

const router: IRouter = Router();

const BADGES = ["Newcomer", "Contributor", "Advanced", "Expert", "Legend"];

function getBadge(count: number): string {
  if (count >= 200) return "Legend";
  if (count >= 100) return "Expert";
  if (count >= 50) return "Advanced";
  if (count >= 10) return "Contributor";
  return "Newcomer";
}

function formatContributor(user: InstanceType<typeof User>, rank: number) {
  return {
    id: user._id.toString(),
    username: user.username,
    name: user.name ?? null,
    avatar: user.avatar ?? null,
    contributions: user.issueCount,
    rank,
    badge: getBadge(user.issueCount),
    location: user.location ?? null,
    joinedAt: user.createdAt.toISOString(),
  };
}

router.get("/contributors", async (req, res): Promise<void> => {
  const query = GetContributorsQueryParams.safeParse(req.query);
  const search = query.success ? query.data.search ?? "" : "";

  const filter: Record<string, unknown> = {};
  if (search) {
    filter["username"] = { $regex: search, $options: "i" };
  }

  const users = await User.find(filter).sort({ issueCount: -1 });
  const contributors = users.map((u, i) => formatContributor(u, i + 1));

  const totalContributions = users.reduce((sum, u) => sum + u.issueCount, 0);
  const topContributions = users[0]?.issueCount ?? 0;

  res.json({
    contributors,
    stats: {
      totalContributors: users.length,
      totalContributions,
      topContributions,
    },
  });
});

router.get("/contributors/:username", async (req, res): Promise<void> => {
  const params = GetContributorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }

  const user = await User.findOne({ username: params.data.username });
  if (!user) {
    res.status(404).json({ error: "Contributor not found" });
    return;
  }

  const rank = await User.countDocuments({ issueCount: { $gt: user.issueCount } }) + 1;
  res.json(formatContributor(user, rank));
});

export default router;
