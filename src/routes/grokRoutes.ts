import { Router } from "express";
import { GrokController } from "../controllers/GrokController";
import { leveretAuth } from "../middleware/leveretAuth";
import { userRateLimits } from "../middleware/userRateLimits";
import { globalRateLimits } from "../middleware/globalRateLimits";
import { zodValidator } from "../middleware/validator";
import { GrokInputDataSchema } from "../types/grok";
import { confirmation } from "../middleware/confirmation";
import { tokenCheckerGrok } from "../middleware/tokenChecker";
import { GrokClient } from "../clients/GrokClient";

export function grokRoutes() {
  const router = Router();
  const controller = new GrokController();

  router.use(
    zodValidator(GrokInputDataSchema),
    globalRateLimits,
    userRateLimits,
    tokenCheckerGrok,
    confirmation
  );

  router.post("/simple", controller.handler("default"));
  router.post("/hogichan", controller.handler("hogichan"));
  router.post("/nomicord", controller.handler("nomicord"));

  return router;
}
