import fs from "fs";
import {
  CONFIG_FILE,
  DEFAULT_PROMPT_FILE,
  HOGICHAN_PROMPT_FILE,
  NOMICORD_PROMPT_FILE,
} from "./files";

export const RAW_CONFIG = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));

export const DEFAULT_PROMPT = fs.readFileSync(DEFAULT_PROMPT_FILE, "utf-8");
export const HOGICHAN_PROMPT =
  DEFAULT_PROMPT + "\n" + fs.readFileSync(HOGICHAN_PROMPT_FILE, "utf-8");
export const NOMICORD_PROMPT =
  DEFAULT_PROMPT + "\n" + fs.readFileSync(NOMICORD_PROMPT_FILE, "utf-8");
