import { Router } from "express";
import { AiController } from "../controllers/AiController";
import { aiEndpoint } from "../middleware/endpoints/aiEndpoint";
import { globalRateLimits } from "../middleware/auth/globalRateLimits";
import { zodValidator } from "../middleware/sanity/validator";
import { AiInputDataSchema } from "../types/ai";
import { cleanup } from "../middleware/sanity/cleanup";
import { aiTokenChecker } from "../middleware/sanity/aiTokenChecker";
import { filterBody } from "../middleware/sanity/filterBody";
import { leveretAuth } from "../middleware/auth/leveretAuth";
import { jsonWithRawBody } from "../middleware/sanity/jsonWithRawBody";
import { userRateLimits } from "../middleware/auth/userRateLimits";
import { timerStop } from "../middleware/analytics/perf/timer";

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
    controller.prompt
  );

  router.use(timerStop);
  router.use(cleanup);

  return router;
}
