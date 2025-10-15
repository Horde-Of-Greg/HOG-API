import { Request, Response, NextFunction } from "express";
import { getDbHandler } from "../db/DbHandler";
import { getLogger } from "../utils/Logger";

export const globalRateLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const isAllowed = await checkRateLimits();
  if (!isAllowed) {
    getLogger().simpleLog("warn", `Global Rate Limit Reached`);
    res
      .status(429)
      .json({ error: "You're Being Rate Limited by the Global Rate Limit" });
  }
  getDbHandler().updateGlobalRates("take");
  next();
};

async function checkRateLimits() {
  const rates = await getDbHandler().getGlobalRates();
  if (!rates) return false;
  return rates > 0;
}
