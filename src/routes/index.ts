import { Router } from "express";
import { grokRoutes } from "./grokRoutes";

export function routes() {
  const router = Router();
  router.use("/grok", grokRoutes());
  return router;
}
