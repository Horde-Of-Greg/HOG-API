import { NextFunction, Request, RequestHandler, Response } from "express";
import { getGrokClient } from "../clients/GrokClient";
import {
  DEFAULT_PROMPT,
  HOGICHAN_PROMPT,
  NOMICORD_PROMPT,
} from "../loaders/storage";
import { GrokInputData, SystemPromptChoice } from "../types/grok";
import { formatCompletion } from "../utils/formatter";
import { getLogger } from "../utils/Logger";
import { startTimer, stopTimer } from "../utils/Timer";
import { duration } from "zod/v4/classic/iso.cjs";

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
      const reqBody = req.body;

      try {
        if (!reqBody) throw new Error();

        startTimer("grok-req");
        const completion = await this.answerQuestionGeneric(reqBody, type);

        const time_taken_ms = stopTimer("grok-req").getTime();
        getLogger().simpleLog("info", `Served Request in ${time_taken_ms}ms`);

        res.json({ completion: completion, duration: time_taken_ms });
      } catch (err) {
        next(err);
      }
    };
}
