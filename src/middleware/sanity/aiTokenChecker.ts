import type { NextFunction, Request, Response } from "express";

import { config } from "../../config/config";
import { getLogger } from "../../helpers/Logger";
import { findDcUsernameById } from "../../utils/bot/usernames";
import { tokenizeGrok } from "../../utils/grok/grok";

export const aiTokenChecker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // TODO: Implement model-specific tokenization based on aiModel
    // For now, using Grok tokenizer as default
    const tokenizedPrompt = await tokenizeGrok(req.body.prompt, modelConfig.MODEL);
    const tokenizedContext = await tokenizeGrok(req.body.context, modelConfig.MODEL);

    if (!tokenizedPrompt || !tokenizedContext) {
        res.status(502).json({ error: "AI Tokenizer errored" });
        return;
    }

    if (tokenizedPrompt.tokenCount > modelConfig.MAX_PROMPT_TK) {
        res.status(403).json({ error: "Token count exceeds the maximum allowed limit" });
        return;
    }

    if (tokenizedContext.tokenCount > modelConfig.MAX_CONTEXT_TK) {
        res.status(403).json({ error: "Context count exceeds the maximum allowed limit" });
        return;
    }

    const totalTokens = tokenizedPrompt.tokenCount + tokenizedContext.tokenCount;
    const username = await findDcUsernameById(req.body.userId);
    getLogger().simpleLog(
        "telemetry",
        `${username} passed a request for ${totalTokens} tokens on ${aiModel}`,
    );
    next();
};

// Legacy export for backwards compatibility
export const tokenCheckerGrok = aiTokenChecker;
