import { Router } from "express";
import { timerStart, timerStop } from "../middleware/analytics/perf/timer";
import { cleanup } from "../middleware/sanity/cleanup";
import { aiRoutes } from "./ai";
import { membersRoutes } from "./members";
import { oredicRoutes } from "./oredic";
import { loadEndpoint } from "../middleware/endpoints/loadEndpoint";

export function routes() {
  const router = Router();

  router.use(timerStart);
  router.use(loadEndpoint);

  router.use("/ai", aiRoutes());
  router.use("/members", membersRoutes());
  router.use("/oredic", oredicRoutes());

  return router;
}
