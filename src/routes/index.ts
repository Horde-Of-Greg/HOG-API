import { Router } from "express";

import { timerStart } from "../middleware/analytics/perf/timer";
import { loadEndpoint } from "../middleware/endpoints/loadEndpoint";
import { aiRoutes } from "./ai";
import { membersRoutes } from "./members";
import { oredicRoutes } from "./oredic";

export function routes() {
    const router = Router();

    router.use(timerStart);
    router.use(loadEndpoint);

    router.use("/ai", aiRoutes());
    router.use("/members", membersRoutes());
    router.use("/oredic", oredicRoutes());

    return router;
}
