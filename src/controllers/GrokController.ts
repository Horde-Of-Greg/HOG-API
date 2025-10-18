import { NextFunction, Request, RequestHandler, Response } from "express";
import { getGrokClient } from "../clients/GrokClient";
import {
  DEFAULT_PROMPT,
  HOGICHAN_PROMPT,
  NOMICORD_PROMPT,
} from "../loaders/storage";
import { GrokInputData, SystemPromptChoice } from "../types/grok";
import { formatCompletion } from "../utils/grok/formatter";
import { getLogger } from "../utils/Logger";
import { startTimer, stopTimer } from "../utils/Timer";

export class GrokController {
  constructor() {}

  static systemPromptMappings = {
    default: DEFAULT_PROMPT,
    hogichan: HOGICHAN_PROMPT,
    nomicord: NOMICORD_PROMPT,
  };

  async answerQuestionGeneric(
    reqBody: GrokInputData,
    model: string,
    type: SystemPromptChoice,
    endpointName: string
  ) {
    return await getGrokClient().client.chat.completions.create(
      await formatCompletion(reqBody, model, type, endpointName)
    );
  }

  handler =
    (): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
      const reqBody = req.body;
      const endpointConfig = req.endpointConfig?.config;

      if (!reqBody) {
        next(new Error("Request body is missing"));
        return;
      }

      if (!endpointConfig) {
        next(new Error("Endpoint configuration is missing"));
        return;
      }

      const model = endpointConfig.model;
      const systemPrompt = endpointConfig.systemPrompt;
      const endpointName = endpointConfig.endpointName;

      try {
        startTimer("grok-req");
        const completion = await this.answerQuestionGeneric(
          reqBody,
          model,
          systemPrompt,
          endpointName
        );

        const time_taken_ms = stopTimer("grok-req").getTime();
        getLogger().simpleLog(
          "info",
          `Served Request on ${endpointConfig.endpointName} in ${time_taken_ms}ms`
        );

        res.json({ completion: completion, duration: time_taken_ms });
      } catch (err) {
        next(err);
      }
    };
}
