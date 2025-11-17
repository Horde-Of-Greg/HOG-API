import { Request, Response, NextFunction } from "express";
import { getDbHandler } from "../../db/DbHandler";
import { getLogger } from "../../utils/Logger";
import { config } from "../../config/config";

export const userRateLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.body.userId;
  const aiModel = req.ai?.model;

  if (!aiModel) {
    res.status(500).json({ error: "AI model not found" });
    return;
  }

  const modelConfig = config.ENDPOINTS[aiModel];
  if (!modelConfig) {
    res.status(500).json({ error: "Model configuration not found" });
    return;
  }

  const isAllowed = await checkRateLimits(
    userId,
    aiModel,
    modelConfig.RATE_LIMIT.USER.WHITELIST
  );

  if (!isAllowed) {
    const username = await getDbHandler().getUsername(userId, aiModel);
    getLogger().simpleLog(
      "warn",
      `User: ${username} got rate limited on ${aiModel}`
    );
    res.status(429).json({ error: "You're Being Rate Limited" });
    return;
  }

  next();
};

async function checkRateLimits(
  dcUserId: string,
  modelName: string,
  whitelist: string[]
) {
  if (whitelist.includes(dcUserId)) return true;
  const rates = await getDbHandler().getUserRates(dcUserId, modelName);
  return rates > 0;
}
