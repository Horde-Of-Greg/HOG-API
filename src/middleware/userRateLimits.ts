import { Request, Response, NextFunction } from "express";
import { getDbHandler } from "../db/DbHandler";
import { getLogger } from "../utils/Logger";

export const userRateLimits = async (
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

  const isAllowed = await checkRateLimits(
    userId,
    endpointConfig.endpointName,
    endpointConfig.rateLimit.USER.WHITELIST
  );

  if (!isAllowed) {
    const username = await getDbHandler().getUsername(
      userId,
      endpointConfig.endpointName
    );
    getLogger().simpleLog(
      "warn",
      `User: ${username} got rate limited on ${endpointConfig.endpointName}`
    );
    res.status(429).json({ error: "You're Being Rate Limited" });
    return;
  }

  await getDbHandler().updateUserRates(
    userId,
    endpointConfig.endpointName,
    "take"
  );
  next();
};

async function checkRateLimits(
  dcUserId: string,
  endpointName: string,
  whitelist: string[]
) {
  if (whitelist.includes(dcUserId)) return true;
  const rates = await getDbHandler().getUserRates(dcUserId, endpointName);
  return rates > 0;
}
