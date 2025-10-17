import z, { base64, string } from "zod";

export const EnvFileSchema = z.object({
  GROK_API_KEY: z.string().min(1),
  DISCORD_BOT_TOKEN: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LEVERET_PUB_KEY_B64: z.base64(),
  REDIS_USERNAME: z.string(),
  REDIS_PASSWORD: z
    .string()
    .min(8, "Password is too short. Change your DB's password."),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().min(1).max(9999),
});

const RateLimitConfigSchema = z.object({
  maxStored: z.number().int().positive(),
  incrementInterval_s: z.number().int().positive(),
  incrementAmount: z.number().int().min(1),
});

const EndpointConfigSchema = z.object({
  model: z.string(),
  maxPromptTokens: z.number().int().min(10).max(9999),
  maxContextTokens: z.number().int().max(9999),
  maxTotalTokens: z.number().int().min(10).max(19999),
  filters: z.string(), // Reference to filters config key
  rateLimit: z.object({
    global: RateLimitConfigSchema,
    user: RateLimitConfigSchema.extend({
      whitelist: z.array(z.string().min(18).max(19).optional()),
    }),
  }),
});

export const ConfigFileSchema = z.object({
  port: z.number().int().min(1).max(9999),
  grokTimeout_ms: z.number().int().min(1000),
  runningIp: z.ipv4(),
  loggerName: z.string(),
  skipLeveretAuth: z.boolean(),
  acceptedTags: z.array(z.string().optional()),
  endpoints: z.record(z.string(), EndpointConfigSchema),
});

const endpointSpecificFiltersConfigSchema = z.object({
  enabledFilters: z.array(string()),
  filterAction: z.enum(["warn", "replace", "block"]),
  logViolations: z.boolean(),
  customMessage: z.string(),
});

export const FiltersConfigFileSchema = z.object({
  grok: endpointSpecificFiltersConfigSchema,
});
