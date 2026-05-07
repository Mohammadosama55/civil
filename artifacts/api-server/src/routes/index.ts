import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import complaintsRouter from "./complaints";
import pollsRouter from "./polls";
import feedbackRouter from "./feedback";
import contactRouter from "./contact";
import contributorsRouter from "./contributors";
import sosRouter from "./sos";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(complaintsRouter);
router.use(pollsRouter);
router.use(feedbackRouter);
router.use(contactRouter);
router.use(contributorsRouter);
router.use(sosRouter);
router.use(adminRouter);

export default router;
