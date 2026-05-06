import { Router, type IRouter } from "express";
import { Contact } from "../models/Contact";
import { SendContactMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SendContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await Contact.create(parsed.data);
  res.status(201).json({ message: "Message sent successfully. We will respond within 24 hours." });
});

export default router;
