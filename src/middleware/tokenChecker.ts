import { Request, Response, NextFunction } from "express";
import { getLogger } from "../utils/Logger";
import { tokenizeGrok } from "../utils/grok";
import { config } from "../config/config";
import { findDcUsernameById } from "../utils/discordUtil";

export const tokenCheckerGrok = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const tokenizedPrompt = await tokenizeGrok(
    req.body.prompt,
    config.GROK_MODEL
  );
  const tokenizedContext = await tokenizeGrok(
    req.body.context,
    config.GROK_MODEL
  );

  if (!tokenizedPrompt || !tokenizedContext) {
    res.status(502).json("Grok Tokenizer Errored");
    return;
  }

  if (tokenizedPrompt.tokenCount > config.MAX_PROMPT_TK) {
    res.status(403).json("Token count exceeds the maximum allowed limit");
    return;
  }

  if (tokenizedContext.tokenCount > config.MAX_CONTEXT_TK) {
    res.status(403).json("Context count exceeds the maximum allowed limit");
    return;
  }

  getLogger().simpleLog(
    "info",
    `${await findDcUsernameById(req.body.userId)} passed a request for ${
      tokenizedPrompt.tokenCount + tokenizedContext.tokenCount
    } tokens`
  );
  next();
};
