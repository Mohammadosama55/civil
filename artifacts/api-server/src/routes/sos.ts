import { Router, type IRouter } from "express";
import { SOS } from "../models/SOS";
import { TriggerSOSBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/sos", async (req, res): Promise<void> => {
  const parsed = TriggerSOSBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const alert = await SOS.create(parsed.data);
  res.status(201).json({
    id: alert._id.toString(),
    status: "received",
    message: "Emergency alert received. Authorities have been notified. Stay calm and stay safe.",
  });
});

export default router;
