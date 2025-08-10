import { Request, Response, NextFunction } from "express";
import { getDbHandler } from "../db/DbHandler";
import { getLogger } from "../utils/Logger";

export const rateLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.body.userId;
  const username = getDbHandler().getUsername(userId);
  const isAllowed = await checkRateLimits(req.body.userId);
  if (!isAllowed) {
    getLogger().simpleLog("warn", `User: ${username} got rate limited`);
    res.status(429).json({ error: "You're Being Rate Limited" });
  }
  next();
};

async function checkRateLimits(dcUserId: string) {
  const rates = await getDbHandler().getUserRates(dcUserId);
  return rates > 0;
}
