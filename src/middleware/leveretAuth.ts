import { Request, Response, NextFunction } from "express";
import { config } from "../config/config";
import { createHash, verify } from "crypto";
import { LEVERET_PUBLIC_KEY } from "../loaders/keys";
import { getLogger } from "../utils/Logger";

export const leveretAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authResult = authRequest(req);

  if (!authResult) {
    // TODO: Better logs
    getLogger().simpleLog("warn", "Unauthorized Request For Leveret");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

const HEADERS = {
  signature: "x-leveret-signature-ed25519",
  tag: "x-leveret-tag",
  timestamp: "x-leveret-timestamp",
  requestId: "x-leveret-request-id",
};

function authRequest(req: any) {
  if (config.SKIP_LEVERET_AUTH) return true;

  // Mostly from https://gist.github.com/NotMyWing/632d738644c17aa71931169af5cb2767
  const headers = req.headers ?? {};
  const signatureB64 = headers[HEADERS.signature];
  const tagName = headers[HEADERS.tag];
  const timestamp = headers[HEADERS.timestamp];
  const requestId = headers[HEADERS.requestId];

  // Do less expensive checks first to save on potential compute
  if (!signatureB64 || !tagName) return false;
  if (!config.ACCEPTED_TAGS.includes(tagName)) return false;

  const method = String(req.method ?? "GET").toUpperCase();
  const host = req.get?.("host") ?? headers.host;
  if (!host) return false;

  const url = `${req.protocol ?? "https"}://${host}${
    req.originalUrl ?? req.url ?? ""
  }`;
  const bodyHash = createHash("sha256")
    .update(req.rawBody ?? Buffer.alloc(0))
    .digest("hex");
  const canonical = [timestamp, requestId, method, url, bodyHash].join("\n");

  const signature = Buffer.from(signatureB64, "base64");
  const valid = verify(
    null,
    Buffer.from(canonical),
    LEVERET_PUBLIC_KEY,
    signature
  );
  if (!valid) return false;

  return true;
}
