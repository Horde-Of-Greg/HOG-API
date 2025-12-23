import { Router } from "express";

import { OredicController } from "../controllers/OredicController";
import { timerStop } from "../middleware/analytics/perf/timer";
import { oredicEndpoint } from "../middleware/endpoints/oredicEndpoint";
import { cleanup } from "../middleware/sanity/cleanup";
import { jsonWithRawBody } from "../middleware/sanity/jsonWithRawBody";

export function oredicRoutes() {
    const router = Router();
    const controller = new OredicController();

    router.use(jsonWithRawBody());

    router.post("/:pack/:action", oredicEndpoint, controller.simplify);

    router.use(timerStop);
    router.use(cleanup);

    return router;
}
