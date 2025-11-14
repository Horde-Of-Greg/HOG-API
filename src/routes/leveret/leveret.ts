import { Router } from "express";
import { grokRoutes } from "./grok/grok";
import { setEndpointData } from "../../middleware/setEndpointData";
import { oredicRoutes } from "../util/oredic/oredic-ae2";

export function leveretRoutes() {
  const router = Router();

  router.use("/grok", setEndpointData("main", "grok"), grokRoutes());

  router.use(
    "/premium-grok",
    setEndpointData("main", "premium-grok"),
    grokRoutes()
  );

  return router;
}
