import { Router, type IRouter } from "express";
import { Feedback } from "../models/Feedback";
import { SubmitFeedbackBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatFeedback(f: InstanceType<typeof Feedback>) {
  return {
    id: f._id.toString(),
    name: f.name ?? null,
    email: f.email ?? null,
    phone: f.phone ?? null,
    category: f.category,
    rating: f.rating,
    message: f.message,
    createdAt: f.createdAt.toISOString(),
  };
}

router.get("/feedback", async (_req, res): Promise<void> => {
  const feedback = await Feedback.find().sort({ createdAt: -1 });
  res.json(feedback.map(formatFeedback));
});

router.post("/feedback", async (req, res): Promise<void> => {
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const feedback = await Feedback.create(parsed.data);
  res.status(201).json(formatFeedback(feedback));
});

export default router;
