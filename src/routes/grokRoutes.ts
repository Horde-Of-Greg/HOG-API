import { Router } from "express";
import { GrokController } from "../controllers/GrokController";
import { leveretAuth } from "../middleware/leveretAuth";
import { rateLimits } from "../middleware/userRateLimits";
import { validateRequest } from "../middleware/validateRequest";

export function grokRoutes() {
  const router = Router();
  const controller = new GrokController();

  router.use(leveretAuth, validateRequest, rateLimits);

  router.post("/simple", controller.handler("default"));
  router.post("/hogichan", controller.handler("hogichan"));
  router.post("/nomicord", controller.handler("nomicord"));

  return router;
}
