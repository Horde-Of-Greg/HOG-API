import { Request, Response, NextFunction } from "express";
import { config } from "../../config/config";
import {
  AI_MODELS,
  SYSTEM_PROMPTS,
  AiModel,
  SystemPrompt,
} from "../../config/routes";
import "../../types/express";

export const aiEndpoint = (req: Request, res: Response, next: NextFunction) => {
  const { model, systemPrompt } = req.params;

  const isValidModel = AI_MODELS.includes(model as AiModel);
  if (!isValidModel) {
    res.status(404).json({
      error: "Model not found",
      message: `Model must be one of: ${AI_MODELS.join(", ")}`,
    });
    return;
  }

  const isValidPrompt = SYSTEM_PROMPTS.includes(systemPrompt as SystemPrompt);
  if (!isValidPrompt) {
    res.status(400).json({
      error: "Invalid system prompt",
      message: `System prompt must be one of: ${SYSTEM_PROMPTS.join(", ")}`,
    });
    return;
  }

  const modelConfig = config.ENDPOINTS[model];
  if (!modelConfig) {
    res.status(500).json({ error: "Model configuration missing" });
    return;
  }

  req.ai = {
    model: model as AiModel,
    systemPrompt: systemPrompt as SystemPrompt,
  };

  next();
};
