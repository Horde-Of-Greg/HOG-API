import { NextFunction, Request, RequestHandler, Response } from "express";
import { getGrokClient } from "../clients/GrokClient";
import {
  DEFAULT_PROMPT,
  HOGICHAN_PROMPT,
  NOMICORD_PROMPT,
} from "../loaders/storage";
import { GrokInputData, SystemPromptChoice } from "../types/grok";
import { formatCompletion } from "../utils/formatter";

export class GrokController {
  constructor() {}

  static systemPromptMappings = {
    default: DEFAULT_PROMPT,
    hogichan: HOGICHAN_PROMPT,
    nomicord: NOMICORD_PROMPT,
  };

  async answerQuestionGeneric(
    reqBody: GrokInputData,
    type: SystemPromptChoice
  ) {
    return await getGrokClient().client.chat.completions.create(
      await formatCompletion(reqBody, type)
    );
  }

  handler =
    (type: SystemPromptChoice): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const reqBody = req.body;
        if (!reqBody) throw new Error();
        const completion = await this.answerQuestionGeneric(reqBody, type);
        res.json({ completion: completion });
      } catch (err) {
        next(err);
      }
    };
}
