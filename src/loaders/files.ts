import path from "path";

const STORAGE_DIR = path.join(process.cwd(), "storage");
const CONFIG_DIR = path.join(STORAGE_DIR, "config");
const PROMPTS_DIR = path.join(STORAGE_DIR, "prompts");

export const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
export const DEFAULT_PROMPT_FILE = path.join(PROMPTS_DIR, "default.txt");
export const HOGICHAN_PROMPT_FILE = path.join(PROMPTS_DIR, "hogichan.txt");
export const NOMICORD_PROMPT_FILE = path.join(PROMPTS_DIR, "nomicord.txt");
