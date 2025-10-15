import { NextFunction, Response, Request } from "express";
import { getLogger } from "../utils/Logger";

export const confirmation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  getLogger().simpleLog("info", "Authorized Request");
  next();
};
