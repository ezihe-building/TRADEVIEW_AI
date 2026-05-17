import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeChartRouter from "./analyze-chart";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeChartRouter);

export default router;
