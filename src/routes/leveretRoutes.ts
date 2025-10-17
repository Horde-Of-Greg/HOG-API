import { Router } from "express";
import { leveretAuth } from "../middleware/leveretAuth";
import { grokRoutes } from "./grokRoutes";

export function leveretRoutes() {
  const router = Router();
  router.use("/grok", grokRoutes());
  return router;
}
