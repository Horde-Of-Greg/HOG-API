import z from "zod";
import {
  ConfigFileSchema,
  EnvFileSchema,
  FiltersConfigFileSchema,
} from "./fileSchema";

export const EnvSchema = EnvFileSchema;
export const FilterConfigSchema = FiltersConfigFileSchema;

export const ConfigSchema = ConfigFileSchema.transform((f) => ({
  PORT: f.port,
  GROK_TIMEOUT: f.grokTimeout_ms,
  RUNNING_IP: f.runningIp,
  LOGGER_NAME: f.loggerName,
  SKIP_LEVERET_AUTH: f.skipLeveretAuth,
  ACCEPTED_TAGS: f.acceptedTags,
  ENDPOINTS: Object.fromEntries(
    Object.entries(f.endpoints).map(([key, endpoint]) => [
      key,
      {
        MODEL: endpoint.model,
        MAX_PROMPT_TK: endpoint.maxPromptTokens,
        MAX_CONTEXT_TK: endpoint.maxContextTokens,
        MAX_TOTAL_TK: endpoint.maxTotalTokens,
        FILTERS: endpoint.filters,
        RATE_LIMIT: {
          GLOBAL: {
            MAX_STORED: endpoint.rateLimit.global.maxStored,
            INTERVAL: endpoint.rateLimit.global.incrementInterval_s,
            AMOUNT: endpoint.rateLimit.global.incrementAmount,
          },
          USER: {
            MAX_STORED: endpoint.rateLimit.user.maxStored,
            INTERVAL: endpoint.rateLimit.user.incrementInterval_s,
            AMOUNT: endpoint.rateLimit.user.incrementAmount,
            WHITELIST: endpoint.rateLimit.user.whitelist.filter(
              (id): id is string => Boolean(id)
            ),
          },
        },
      },
    ])
  ),
}));

export type Env = z.infer<typeof EnvSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type FiltersConfig = z.infer<typeof FilterConfigSchema>;
export type EndpointConfig = Config["ENDPOINTS"][string];
