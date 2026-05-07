import { Router, type IRouter } from "express";
import * as complaintController from "../controllers/complaintController";

const router: IRouter = Router();

router.get("/issues", complaintController.listComplaints);
router.get("/issues/alerts", complaintController.getAlerts);
router.get("/issues/stats", complaintController.getStats);
router.get("/issues/heatmap", complaintController.getHeatmap);
router.get("/issues/:id", complaintController.getComplaint);
router.post("/issues", complaintController.createComplaint);
router.patch("/issues/:id", complaintController.updateComplaint);
router.delete("/issues/:id", complaintController.deleteComplaint);
router.post("/issues/:id/upvote", complaintController.upvoteComplaint);

export default router;
