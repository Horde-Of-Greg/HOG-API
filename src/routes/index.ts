import { Router } from "express";
import { grokRoutes } from "./leveret/grok/grok";
import { leveretRoutes } from "./leveret/leveret";
import { leveretAuth } from "../middleware/leveretAuth";
import { jsonWithRawBody } from "../middleware/jsonWithRawBody";
import { initEndpointHandler } from "../utils/Endpoint";
import { setEndpointData } from "../middleware/setEndpointData";
import { dataRoutes } from "./data/data";

export function routes() {
  const router = Router();
  router.use(
    "/leveret",
    jsonWithRawBody(),
    setEndpointData("source", "leveret"),
    leveretAuth,
    leveretRoutes()
  );

  router.use("/data", setEndpointData("source", "data"), dataRoutes());
  return router;
}
