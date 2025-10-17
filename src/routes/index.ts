import { Router } from "express";
import express from "express";
import { grokRoutes } from "./grokRoutes";
import { leveretRoutes } from "./leveretRoutes";
import { leveretAuth } from "../middleware/leveretAuth";
import { rawBodyCapture } from "../middleware/rawBodyCapture";

export function routes() {
  const router = Router();
  // Apply rawBodyCapture before JSON parsing for signature verification
  router.use(
    "/leveret",
    rawBodyCapture,
    express.json(),
    leveretAuth,
    leveretRoutes()
  );
  return router;
}
