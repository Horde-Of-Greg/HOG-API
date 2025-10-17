import { Request, Response, NextFunction } from "express";
import { ZodError, ZodObject } from "zod";
import { getLogger } from "../utils/Logger";

export const zodValidator = (schema: ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      getLogger().simpleLog("warn", `Zod data input validation failed`);
      res.status(400).json({
        error: "Validation Error",
        details: parsed.error.issues.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
};
