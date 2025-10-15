import { Router } from "express";
import { GrokController } from "../controllers/GrokController";
import { leveretAuth } from "../middleware/leveretAuth";
import { userRateLimits } from "../middleware/userRateLimits";
import { validateRequest } from "../middleware/validateRequest";
import { globalRateLimits } from "../middleware/globalRateLimits";

export function grokRoutes() {
  const router = Router();
  const controller = new GrokController();

  router.use(leveretAuth, validateRequest, globalRateLimits, userRateLimits);

  router.post("/simple", controller.handler("default"));
  router.post("/hogichan", controller.handler("hogichan"));
  router.post("/nomicord", controller.handler("nomicord"));

  return router;
}
