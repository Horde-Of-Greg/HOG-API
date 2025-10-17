import { Request, Response, NextFunction } from "express";
import { getDbHandler } from "../db/DbHandler";
import { getLogger } from "../utils/Logger";

export const globalRateLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const endpointConfig = req.endpointConfig?.config;

  if (!endpointConfig) {
    res.status(500).json({ error: "Endpoint configuration not found" });
    return;
  }

  const isAllowed = await checkRateLimits(
    req.body.userId,
    endpointConfig.endpointName,
    endpointConfig.rateLimit.USER.WHITELIST
  );
  if (!isAllowed) {
    getLogger().simpleLog(
      "warn",
      `Global Rate Limit Reached for ${endpointConfig.endpointName}`
    );
    res
      .status(429)
      .json({ error: "You're Being Rate Limited by the Global Rate Limit" });
    return;
  }
  await getDbHandler().updateGlobalRates(endpointConfig.endpointName, "take");
  next();
};

async function checkRateLimits(
  dcUserId: string,
  endpointName: string,
  whitelist: string[]
) {
  if (whitelist.includes(dcUserId)) return true;
  const rates = await getDbHandler().getGlobalRates(endpointName);
  if (rates === null) return false;
  return rates > 0;
}
