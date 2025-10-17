import { config } from "../config/config";
import { LogType } from "../types/server";

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
    format: "\x1b[37m", // White
    reset: "\x1b[0m",
  };

  simpleLog(type: LogType, message: string) {
    const name = `[${this.name}:${type.toUpperCase()}]`;
    const date = `[${this.getDateTime()}]`;
    const whitespaces = " ".repeat("success".length - type.length);
    const content = message;
    const color = Logger.colors[type];
    const log = `${color}${name}${whitespaces}@${date}: ${content}${Logger.colors.reset}`;
    console.log(log);
  }

  formattingLog(title: string) {
    const type = "format";
    const name = `[${this.name}:${type.toUpperCase()}]`;
    const date = `[${this.getDateTime()}]`;
    const whitespaces = " ".repeat("success".length - type.length);
    const targetLength = 50;
    const dashesNb = (targetLength - title.length) / 2;
    const dashes = "-".repeat(dashesNb);
    const extraDash = dashesNb % 1 != 0 ? "-" : "";
    const content = `|${dashes} ${title} ${dashes}${extraDash}|`;
    const color = Logger.colors[type];
    const log = `${color}${name}${whitespaces}@${date}: ${content}${Logger.colors.reset}`;
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
