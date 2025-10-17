import { Router } from "express";
import { leveretAuth } from "../middleware/leveretAuth";
import { grokRoutes } from "./grokRoutes";
import { setEndpointData } from "../middleware/setEndpointData";

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
