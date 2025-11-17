import { Request, Response, NextFunction } from "express";
import { GrokService } from "../services/ai/GrokService";

export class AiController {
  private service = new GrokService();

  prompt = async (req: Request, res: Response, next: NextFunction) => {
    const { model, systemPrompt } = req.ai || {};

    if (!model || !systemPrompt) {
      return next(new Error("AI model or system prompt is missing"));
    }

    try {
      const completion = await this.service.generateCompletion(
        req.body,
        model,
        systemPrompt
      );

      res.data = completion;
      next();
    } catch (error) {
      next(error);
    }
  };
}
