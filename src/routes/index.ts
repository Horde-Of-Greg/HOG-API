import { Router } from "express";
import { grokRoutes } from "./grokRoutes";
import { leveretRoutes } from "./leveretRoutes";
import { leveretAuth } from "../middleware/leveretAuth";
import { jsonWithRawBody } from "../middleware/jsonWithRawBody";
import { initEndpointHandler } from "../utils/Endpoint";
import { setEndpointData } from "../middleware/setEndpointData";

export function routes() {
  const router = Router();
  router.use(
    "/leveret",
    jsonWithRawBody(),
    setEndpointData("source", "leveret"),
    leveretAuth,
    leveretRoutes()
  );
  return router;
}
