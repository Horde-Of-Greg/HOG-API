import fs from "fs";
import {
  CONFIG_FILE,
  DEFAULT_PROMPT_FILE,
  DUMPS_FILES,
  FILTERS_CONFIG_FILE,
  HOGICHAN_PROMPT_FILE,
  NOMICORD_PROMPT_FILE,
} from "./files";

export const RAW_CONFIG = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
export const RAW_FILTERS_CONFIG = JSON.parse(
  fs.readFileSync(FILTERS_CONFIG_FILE, "utf-8")
);

export const DEFAULT_PROMPT = fs.readFileSync(DEFAULT_PROMPT_FILE, "utf-8");
export const HOGICHAN_PROMPT =
  DEFAULT_PROMPT + "\n" + fs.readFileSync(HOGICHAN_PROMPT_FILE, "utf-8");
export const NOMICORD_PROMPT =
  DEFAULT_PROMPT + "\n" + fs.readFileSync(NOMICORD_PROMPT_FILE, "utf-8");

export const DUMPS = new Map<string, string>();
DUMPS_FILES.forEach((file, fileName) => {
  DUMPS.set(fileName, fs.readFileSync(file, "utf-8"));
});
