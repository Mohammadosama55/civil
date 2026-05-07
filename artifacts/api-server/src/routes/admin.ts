import { Router, type IRouter } from "express";
import { requireWardAdmin } from "../middleware/auth";
import * as adminController from "../controllers/adminController";

const router: IRouter = Router();

router.get("/admin/dashboard", requireWardAdmin, adminController.getDashboard);
router.patch("/admin/issues/:id/status", requireWardAdmin, adminController.updateComplaintStatus);
router.get("/admin/issues/:id/pdf", requireWardAdmin, adminController.downloadComplaintPDF);
router.get("/admin/users", requireWardAdmin, adminController.listUsers);
router.patch("/admin/users/:id/role", requireWardAdmin, adminController.updateUserRole);

export default router;
