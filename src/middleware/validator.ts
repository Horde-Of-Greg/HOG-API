import { Request, Response, NextFunction } from "express";
import { ZodError, ZodObject } from "zod";
import { getLogger } from "../utils/Logger";

export const zodValidator = (schema: ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errorDetails = parsed.error.issues.map((e: any) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      getLogger().simpleLog("debug", JSON.stringify(req.body));

      getLogger().simpleLog(
        "warn",
        `Zod validation failed: ${JSON.stringify(errorDetails)}`
      );

      res.status(400).json({
        error: "Validation Error",
        details: errorDetails,
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
};
