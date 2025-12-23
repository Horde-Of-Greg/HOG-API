import type { Config, Env, FiltersConfig } from "./schema";
import { ConfigSchema, EnvSchema, FilterConfigSchema } from "./schema";

export function validateEnvs(): Env {
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
        const errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        throw new Error(`Env validation failed: ${errors}`);
    }
    return parsed.data;
}

export function validateConfigs(json: object): Config {
    const parsed = ConfigSchema.safeParse(json);
    if (!parsed.success) {
        const errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        throw new Error(`Config validation failed: ${errors}`);
    }
    return parsed.data;
}

export function validateFiltersConfigs(json: object): FiltersConfig {
    const parsed = FilterConfigSchema.safeParse(json);
    if (!parsed.success) {
        const errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        throw new Error(`Filter Config validation failed: ${errors}`);
    }
    return parsed.data;
}
