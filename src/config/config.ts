import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { Config, Env, FiltersConfig } from "./schema";
import {
  validateConfigs,
  validateEnvs,
  validateFiltersConfigs,
} from "./validate";
import { RAW_CONFIG, RAW_FILTERS_CONFIG } from "../loaders/storage";

dotenv.config();

export const env: Env = validateEnvs();
export const config: Config = validateConfigs(RAW_CONFIG);
export const filtersConfig: FiltersConfig =
  validateFiltersConfigs(RAW_FILTERS_CONFIG);
