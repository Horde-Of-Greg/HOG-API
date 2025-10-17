import { Router } from "express";
import { grokRoutes } from "./grokRoutes";
import { leveretRoutes } from "./leveretRoutes";
import { leveretAuth } from "../middleware/leveretAuth";
import { jsonWithRawBody } from "../middleware/rawBodyCapture";

export function routes() {
  const router = Router();
  router.use("/leveret", jsonWithRawBody, leveretAuth, leveretRoutes());
  return router;
}
