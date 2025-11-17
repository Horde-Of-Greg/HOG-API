import { Request, Response, NextFunction } from "express";
import "../../types/express";

export const membersEndpoint = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next();
};
