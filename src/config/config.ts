import dotenv from "dotenv";

import { RAW_CONFIG, RAW_FILTERS_CONFIG } from "../loaders/storage";
import type { Config, Env, FiltersConfig } from "./schema";
import { validateConfigs, validateEnvs, validateFiltersConfigs } from "./validate";

dotenv.config({ quiet: true });

export const env: Env = validateEnvs();
export const config: Config = validateConfigs(RAW_CONFIG);
export const filtersConfig: FiltersConfig = validateFiltersConfigs(RAW_FILTERS_CONFIG);
