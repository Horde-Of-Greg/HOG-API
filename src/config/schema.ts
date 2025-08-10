import z from "zod";
import { ConfigFileSchema, EnvFileSchema } from "./fileSchema";

export const EnvSchema = EnvFileSchema;

export const ConfigSchema = ConfigFileSchema.transform((f) => ({
  PORT: f.port,
  GROK_TIMEOUT: f.grokTimeout_ms,
  RUNNING_IP: f.runningIp,
  MAX_PROMPT_TK: f.maxPromptTokens,
  MAX_CONTEXT_TK: f.maxContextTokens,
  MAX_TOTAL_TK: f.maxTotalTokens,
  LOGGER_NAME: f.loggerName,
  RATE_LIMIT: {
    GLOBAL: {
      MAX_STORED: f.rateLimit.global.maxStored,
      INTERVAL: f.rateLimit.global.incrementInterval_s,
      AMOUNT: f.rateLimit.global.incrementAmount,
    },
    USER: {
      MAX_STORED: f.rateLimit.user.maxStored,
      INTERVAL: f.rateLimit.user.incrementInterval_s,
      AMOUNT: f.rateLimit.user.incrementAmount,
      WHITELIST: f.rateLimit.user.whitelist.filter((id): id is string =>
        Boolean(id)
      ),
    },
  },
  SKIP_LEVERET_AUTH: f.skipLeveretAuth,
  ACCEPTED_TAGS: f.acceptedTags,
}));

export type Env = z.infer<typeof EnvSchema>;
export type Config = z.infer<typeof ConfigSchema>;
