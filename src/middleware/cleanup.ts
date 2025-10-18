import { NextFunction, Response, Request } from "express";
import { getLogger } from "../utils/Logger";
import { getDbHandler } from "../db/DbHandler";

export const cleanup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.body.userId;
  const endpointConfig = req.endpointConfig?.config;

  if (!endpointConfig) {
    res.status(500).json({ error: "Endpoint configuration not found" });
    return;
  }

  if (req.endpointConfig?.source === "leveret") {
    await getDbHandler().updateGlobalRates(endpointConfig.endpointName, "take");
    await getDbHandler().updateUserRates(
      userId,
      endpointConfig.endpointName,
      "take"
    );
  }

  getLogger().simpleLog("info", "Authorized Request");
  next();
};
