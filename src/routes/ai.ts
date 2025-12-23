import { Router } from "express";

import { AiController } from "../controllers/AiController";
import { timerStop } from "../middleware/analytics/perf/timer";
import { globalRateLimits } from "../middleware/auth/globalRateLimits";
import { leveretAuth } from "../middleware/auth/leveretAuth";
import { userRateLimits } from "../middleware/auth/userRateLimits";
import { aiEndpoint } from "../middleware/endpoints/aiEndpoint";
import { aiTokenChecker } from "../middleware/sanity/aiTokenChecker";
import { cleanup } from "../middleware/sanity/cleanup";
import { filterBody } from "../middleware/sanity/filterBody";
import { jsonWithRawBody } from "../middleware/sanity/jsonWithRawBody";
import { zodValidator } from "../middleware/sanity/validator";
import { AiInputDataSchema } from "../types/ai";

export function aiRoutes() {
    const router = Router();
    const controller = new AiController();

    router.use(jsonWithRawBody());
    router.use(leveretAuth);

    router.post(
        "/:model/:systemPrompt",
        aiEndpoint,
        zodValidator(AiInputDataSchema),
        globalRateLimits,
        userRateLimits,
        filterBody,
        aiTokenChecker,
        controller.prompt,
    );

    router.use(timerStop);
    router.use(cleanup);

    return router;
}
