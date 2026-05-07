import { Router, type IRouter } from "express";
import * as authController from "../controllers/authController";

const router: IRouter = Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);
router.get("/auth/me", authController.getMe);
router.patch("/auth/profile", authController.updateProfile);

export default router;
