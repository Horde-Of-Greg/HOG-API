import express from "express";
import { getLogger } from "./utils/Logger";
import { routes } from "./routes";

export function initApp() {
  const app = express();

  app.use(express.json());

  app.use(routes());

  getLogger().simpleLog("success", "Express App Initialized Successfully");
  return app;
}
