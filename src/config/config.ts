import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { Config, Env } from "./schema";
import { validateConfigs, validateEnvs } from "./validate";
import { RAW_CONFIG } from "../loaders/storage";

const configFile = RAW_CONFIG;
dotenv.config();

export const env: Env = validateEnvs();
export const config: Config = validateConfigs(configFile);
