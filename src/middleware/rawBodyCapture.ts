import express from "express";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export const jsonWithRawBody = express.json({
  verify: (req: any, res, buf: Buffer) => {
    req.rawBody = buf;
  },
});
