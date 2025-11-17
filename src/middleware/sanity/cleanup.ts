import { NextFunction, Response, Request } from "express";
import { getDbHandler } from "../../db/DbHandler";
import { getLogger } from "../../utils/Logger";

export const cleanup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const isLeveret = req.flags?.isLeveret;

  if (isLeveret) {
    const userId = req.body.userId;
    const aiModel = req.ai?.model;

    if (aiModel) {
      await getDbHandler().updateGlobalRates(aiModel, "take");
      await getDbHandler().updateUserRates(userId, aiModel, "take");
    }
  }

  res.json({
    ...res.data,
    timing: res.timing,
  });
};
