import { Router, type IRouter } from "express";
import { Poll } from "../models/Poll";
import {
  CreatePollBody,
  VoteOnPollBody,
  GetPollParams,
  VoteOnPollParams,
  GetPollsQueryParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function formatPoll(poll: InstanceType<typeof Poll>) {
  return {
    id: poll._id.toString(),
    question: poll.question,
    description: poll.description ?? null,
    options: poll.options.map((o) => ({ id: o.id, text: o.text, votes: o.votes })),
    totalVotes: poll.totalVotes,
    status: poll.status,
    createdBy: poll.createdBy?.toString() ?? null,
    creatorName: poll.creatorName ?? null,
    endsAt: poll.endsAt ? poll.endsAt.toISOString() : null,
    createdAt: poll.createdAt.toISOString(),
  };
}

router.get("/polls", async (req, res): Promise<void> => {
  const query = GetPollsQueryParams.safeParse(req.query);
  const filter: Record<string, unknown> = {};
  if (query.success && query.data.status) filter["status"] = query.data.status;
  const polls = await Poll.find(filter).sort({ createdAt: -1 });
  res.json(polls.map(formatPoll));
});

router.get("/polls/stats", async (_req, res): Promise<void> => {
  const activePolls = await Poll.countDocuments({ status: "active" });
  const totalVotesAgg = await Poll.aggregate<{ _id: null; total: number }>([
    { $group: { _id: null, total: { $sum: "$totalVotes" } } },
  ]);
  const totalVotes = totalVotesAgg[0]?.total ?? 0;
  const engagement = Math.floor(totalVotes * 1.4);
  res.json({ activePolls, totalVotes, engagement });
});

router.get("/polls/:id", async (req, res): Promise<void> => {
  const params = GetPollParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const poll = await Poll.findById(params.data.id).catch(() => null);
  if (!poll) {
    res.status(404).json({ error: "Poll not found" });
    return;
  }
  res.json(formatPoll(poll));
});

router.post("/polls", async (req, res): Promise<void> => {
  const parsed = CreatePollBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const options = (parsed.data.options ?? []).map((text: string) => ({
    id: randomUUID(),
    text,
    votes: 0,
    votedBy: [],
  }));
  const poll = await Poll.create({
    question: parsed.data.question,
    description: parsed.data.description,
    options,
    endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
  });
  res.status(201).json(formatPoll(poll));
});

router.post("/polls/:id/vote", async (req, res): Promise<void> => {
  const params = VoteOnPollParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const parsed = VoteOnPollBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const poll = await Poll.findById(params.data.id).catch(() => null);
  if (!poll) {
    res.status(404).json({ error: "Poll not found" });
    return;
  }

  const option = poll.options.find((o) => o.id === parsed.data.optionId);
  if (!option) {
    res.status(400).json({ error: "Option not found" });
    return;
  }

  option.votes += 1;
  poll.totalVotes += 1;
  await poll.save();
  res.json(formatPoll(poll));
});

export default router;
