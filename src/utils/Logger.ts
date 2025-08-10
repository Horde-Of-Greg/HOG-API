import { config } from "../config/config";
import { LogType } from "../types/logs";

let logger: Logger | null = null;

export class Logger {
  name: string;

  constructor() {
    this.name = config.LOGGER_NAME;
  }

  static colors = {
    success: "\x1b[32m", // Green
    info: "\x1b[36m", // Cyan
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
    debug: "\x1b[35m", // Magenta
    reset: "\x1b[0m",
  };

  simpleLog(type: LogType, message: string) {
    const name = `[${this.name}:${type.toUpperCase()}]`;
    const date = `[${this.getDateTime()}]`;
    const content = message;
    const color = Logger.colors[type];
    const log = `${color}${name}@${date}: ${content}${Logger.colors.reset}`;
    console.log(log);
  }

  getDateTime() {
    const rawTimestamp = new Date();
    return rawTimestamp.toISOString();
  }
}

export function initLogger(): Logger {
  if (logger) return logger;
  logger = new Logger();
  return logger;
}

export function getLogger(): Logger {
  if (!logger)
    throw new Error("Logger not initialized. Call initLogger() first.");
  return logger;
}
