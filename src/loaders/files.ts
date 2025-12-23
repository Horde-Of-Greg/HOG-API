import fs from "fs";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), "storage");
const CONFIG_DIR = path.join(STORAGE_DIR, "config");
const PROMPTS_DIR = path.join(STORAGE_DIR, "prompts");

export const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
export const FILTERS_CONFIG_FILE = path.join(CONFIG_DIR, "filters.json");

export const DEFAULT_PROMPT_FILE = path.join(PROMPTS_DIR, "default.txt");
export const HOGICHAN_PROMPT_FILE = path.join(PROMPTS_DIR, "hogichan.txt");
export const NOMICORD_PROMPT_FILE = path.join(PROMPTS_DIR, "nomicord.txt");

export const FILTERS_FILES_DIR = path.join(STORAGE_DIR, "filters");
export const FILTERS_FILES = new Map<string, string>();
fs.readdirSync(FILTERS_FILES_DIR).forEach((file) =>
    FILTERS_FILES.set(file.replace(".json", ""), path.join(FILTERS_FILES_DIR, file)),
);

export const OREDIC_DIR = path.join(STORAGE_DIR, "oredic");
export const DUMPS_DIR = path.join(OREDIC_DIR, "dumps");
export const DUMPS_FILES = new Map<string, string>();
fs.readdirSync(DUMPS_DIR).forEach((file) =>
    DUMPS_FILES.set(file.replace(".txt", ""), path.join(DUMPS_DIR, file)),
);
