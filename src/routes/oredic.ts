import { Router } from "express";
import { OredicController } from "../controllers/OredicController";
import { oredicEndpoint } from "../middleware/endpoints/oredicEndpoint";
import { jsonWithRawBody } from "../middleware/sanity/jsonWithRawBody";
import { cleanup } from "../middleware/sanity/cleanup";
import { timerStop } from "../middleware/analytics/perf/timer";

export function oredicRoutes() {
  const router = Router();
  const controller = new OredicController();

  router.use(jsonWithRawBody());

  router.post("/:pack/:action", oredicEndpoint, controller.simplify);

  router.use(timerStop);
  router.use(cleanup);

  return router;
}
