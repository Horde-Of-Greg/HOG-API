import { createPublicKey } from "crypto";
import { config, env } from "../config/config";

export const LEVERET_PUBLIC_KEY = createPublicKey({
  key: Buffer.from(env.LEVERET_PUB_KEY_B64, "base64"),
  format: "der",
  type: "spki",
});
