import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export const rawBodyCapture = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let data = Buffer.from([]);

  req.on("data", (chunk: Buffer) => {
    data = Buffer.concat([data, chunk]);
  });

  req.on("end", () => {
    req.rawBody = data;
    next();
  });

  req.on("error", (err) => {
    next(err);
  });
};
