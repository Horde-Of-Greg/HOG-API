import { Router } from "express";
import { GrokController } from "../../../controllers/GrokController";
import { cleanup } from "../../../middleware/cleanup";
import { endpointData } from "../../../middleware/endpointData";
import { filterBody } from "../../../middleware/filterBody";
import { globalRateLimits } from "../../../middleware/globalRateLimits";
import { setEndpointData } from "../../../middleware/setEndpointData";
import { tokenCheckerGrok } from "../../../middleware/tokenChecker";
import { userRateLimits } from "../../../middleware/userRateLimits";
import { zodValidator } from "../../../middleware/validator";
import { GrokInputDataSchema } from "../../../types/grok";
import { OredicController } from "../../../controllers/OredicController";

export function oredicRoutes() {
  const router = Router();
  const controller = new OredicController();

  router.post(
    "/nomi-ceu",
    setEndpointData("child", "nomi-ceu"),
    endpointData,
    controller.handler()
  );

  return router;
}
