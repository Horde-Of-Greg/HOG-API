import { Request, Response, NextFunction } from "express";
import { getDbHandler } from "../../db/DbHandler";
import { getLogger } from "../../utils/Logger";
import { config } from "../../config/config";

export const globalRateLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    req.body.userId,
    aiModel,
    modelConfig.RATE_LIMIT.USER.WHITELIST
  );
  if (!isAllowed) {
    getLogger().simpleLog("warn", `Global Rate Limit Reached for ${aiModel}`);
    res
      .status(429)
      .json({ error: "You're Being Rate Limited by the Global Rate Limit" });
    return;
  }
  await getDbHandler().updateGlobalRates(aiModel, "take");
  next();
};

async function checkRateLimits(
  dcUserId: string,
  modelName: string,
  whitelist: string[]
) {
  if (whitelist.includes(dcUserId)) return true;
  const rates = await getDbHandler().getGlobalRates(modelName);
  if (rates === null) return false;
  return rates > 0;
}
