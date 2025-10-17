import express from "express";

export function jsonWithRawBody() {
  return express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  });
}
