import { Request, Response, NextFunction } from "express";
import { getDbHandler } from "../db/DbHandler";
import { getLogger } from "../utils/Logger";
import { config } from "../config/config";

export const userRateLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.body.userId;
  const isAllowed = await checkRateLimits(userId);

  if (!isAllowed) {
    const username = await getDbHandler().getUsername(userId);
    getLogger().simpleLog("warn", `User: ${username} got rate limited`);
    res.status(429).json({ error: "You're Being Rate Limited" });
    return;
  }

  await getDbHandler().updateUserRates(userId, "take");
  next();
};

async function checkRateLimits(dcUserId: string) {
  if (config.RATE_LIMIT.USER.WHITELIST.includes(dcUserId)) return true;
  const rates = await getDbHandler().getUserRates(dcUserId);
  return rates > 0;
}
