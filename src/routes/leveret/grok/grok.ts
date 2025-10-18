import { Router } from "express";
import { GrokController } from "../../../controllers/GrokController";
import { userRateLimits } from "../../../middleware/userRateLimits";
import { globalRateLimits } from "../../../middleware/globalRateLimits";
import { zodValidator } from "../../../middleware/validator";
import { GrokInputDataSchema } from "../../../types/grok";
import { confirmation } from "../../../middleware/confirmation";
import { tokenCheckerGrok } from "../../../middleware/tokenChecker";
import { setEndpointData } from "../../../middleware/setEndpointData";
import { endpointData } from "../../../middleware/endpointData";

export function grokRoutes() {
  const router = Router();
  const controller = new GrokController();

  router.post(
    "/simple",
    setEndpointData("child", "simple"),
    endpointData,
    zodValidator(GrokInputDataSchema),
    globalRateLimits,
    userRateLimits,
    tokenCheckerGrok,
    confirmation,
    controller.handler()
  );
  router.post(
    "/hogichan",
    setEndpointData("child", "hogichan"),
    endpointData,
    zodValidator(GrokInputDataSchema),
    globalRateLimits,
    userRateLimits,
    tokenCheckerGrok,
    confirmation,
    controller.handler()
  );
  router.post(
    "/nomicord",
    setEndpointData("child", "nomicord"),
    endpointData,
    zodValidator(GrokInputDataSchema),
    globalRateLimits,
    userRateLimits,
    tokenCheckerGrok,
    confirmation,
    controller.handler()
  );

  return router;
}
