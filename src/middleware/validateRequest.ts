import { Request, Response, NextFunction } from "express";
import { GrokInputData } from "../types/grok";

declare global {
  namespace Express {
    interface Request {
      body: GrokInputData;
    }
  }
}

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body = req.body;

  if (!body || typeof body !== "object") {
    res.status(400).json({
      error: "Bad Request",
      message: "Request body is required",
    });
    return;
  }

  const { userId, prompt, context, attachement } = body;

  if (!userId || typeof userId !== "string") {
    res.status(400).json({
      error: "Bad Request",
      message: "userId is required and must be a string",
    });
    return;
  }

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({
      error: "Bad Request",
      message: "prompt is required and must be a string",
    });
    return;
  }

  if (typeof context !== "string") {
    res.status(400).json({
      error: "Bad Request",
      message: "context must be a string",
    });
    return;
  }

  if (attachement !== null && typeof attachement !== "string") {
    res.status(400).json({
      error: "Bad Request",
      message: "attachement must be a string or null",
    });
    return;
  }

  next();
};
