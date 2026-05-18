import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeChartRouter from "./analyze-chart";
import marketDataRouter from "./market-data";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeChartRouter);
router.use(marketDataRouter);

export default router;
