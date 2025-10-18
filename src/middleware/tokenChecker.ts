import { Request, Response, NextFunction } from "express";
import { getLogger } from "../utils/Logger";
import { tokenizeGrok } from "../utils/grok/grok";
import { findDcUsernameById } from "../utils/bot/usernames";

export const tokenCheckerGrok = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const endpointConfig = req.endpointConfig?.config;

  if (!endpointConfig) {
    res.status(500).json({ error: "Endpoint configuration not found" });
    return;
  }

  const tokenizedPrompt = await tokenizeGrok(
    req.body.prompt,
    endpointConfig.model
  );
  const tokenizedContext = await tokenizeGrok(
    req.body.context,
    endpointConfig.model
  );

  if (!tokenizedPrompt || !tokenizedContext) {
    res.status(502).json("Grok Tokenizer Errored");
    return;
  }

  if (tokenizedPrompt.tokenCount > endpointConfig.maxPromptTokens) {
    res.status(403).json("Token count exceeds the maximum allowed limit");
    return;
  }

  if (tokenizedContext.tokenCount > endpointConfig.maxContextTokens) {
    res.status(403).json("Context count exceeds the maximum allowed limit");
    return;
  }

  getLogger().simpleLog(
    "info",
    `${await findDcUsernameById(req.body.userId)} passed a request for ${
      tokenizedPrompt.tokenCount + tokenizedContext.tokenCount
    } tokens on ${endpointConfig.endpointName}`
  );
  next();
};
