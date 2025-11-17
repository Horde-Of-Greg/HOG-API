import { config } from "../config/config";
import { LogType } from "../types/server";
import { queryTimer } from "./Timer";

let logger: Logger | null = null;

enum AnsiColor {
  ERROR = "\x1b[31m",
  SUCCESS = "\x1b[32m",
  WARN = "\x1b[33m",
  TELEMETRY = "\x1b[34m",
  DEBUG = "\x1b[35m",
  INFO = "\x1b[36m",
  FORMAT = "\x1b[37m",
  RESET = "\x1b[0m",
}

enum FormattingConstant {
  MAX_TYPE_LENGTH = 9, // "success".length
  PROGRESS_BAR_FILLED = "█",
  PROGRESS_BAR_EMPTY = "░",
  FORMATTING_DASH = "-",
  FORMATTING_TARGET_WIDTH = 50,
  SECONDS_PER_MINUTE = 60,
  MILLISECONDS_PER_SECOND = 1000,
}

export class Logger {
  private name: string;

  constructor() {
    this.name = config.LOGGER_NAME;
  }

  simpleLog(type: LogType, message: string): void {
    const timestamp = this.getCurrentTimestamp();
    const logPrefix = this.formatLogPrefix(type, timestamp);
    const coloredMessage = this.colorize(message, type);

    console.log(`${logPrefix}: ${coloredMessage}`);
  }

  formattingLog(title: string): void {
    const timestamp = this.getCurrentTimestamp();
    const logPrefix = this.formatLogPrefix("format", timestamp);
    const formattedTitle = this.formatTitle(title);
    const coloredTitle = this.colorize(formattedTitle, "format");

    console.log(`${logPrefix}: ${coloredTitle}`);
  }

  progressBar(
    currentCount: number,
    totalCount: number,
    timerId: string,
    barWidth: number = 50,
    label: string = ""
  ): void {
    const progress = this.buildProgressBar(
      currentCount,
      totalCount,
      timerId,
      barWidth,
      label
    );

    const coloredProgress = this.colorize(progress, "info");
    process.stdout.write(`\r${coloredProgress}`);

    const isComplete = currentCount === totalCount;
    if (isComplete) {
      process.stdout.write("\n");
    }
  }

  /*
   * Formatting helpers
   */

  private formatLogPrefix(type: LogType | "format", timestamp: string): string {
    const logName = `[${this.name}:${type.toUpperCase()}]`;
    const logTimestamp = `[${timestamp}]`;
    const padding = " ".repeat(
      FormattingConstant.MAX_TYPE_LENGTH - type.length
    );

    return `${logName}${padding}@${logTimestamp}`;
  }

  private formatTitle(title: string): string {
    const dashCount =
      (FormattingConstant.FORMATTING_TARGET_WIDTH - title.length) / 2;
    const dashes = (FormattingConstant.FORMATTING_DASH as string).repeat(
      dashCount
    );
    const hasOddLength = dashCount % 1 !== 0;
    const extraDash = hasOddLength ? FormattingConstant.FORMATTING_DASH : "";

    return `|${dashes} ${title} ${dashes}${extraDash}|`;
  }

  private buildProgressBar(
    currentCount: number,
    totalCount: number,
    timerId: string,
    barWidth: number,
    label: string
  ): string {
    const percentage = Math.floor((currentCount / totalCount) * 100);
    const bar = this.createBar(currentCount, totalCount, barWidth);
    const timeInfo = this.createTimeInfo(currentCount, totalCount, timerId);
    const labelText = label ? ` ${label}` : "";

    return `[${bar}] ${percentage}% (${currentCount}/${totalCount})${labelText} ${timeInfo}`;
  }

  private createBar(
    currentCount: number,
    totalCount: number,
    barWidth: number
  ): string {
    const filledWidth = Math.floor((currentCount / totalCount) * barWidth);
    const emptyWidth = Math.max(0, barWidth - filledWidth);

    const filled = (FormattingConstant.PROGRESS_BAR_FILLED as string).repeat(
      filledWidth
    );
    const empty = (FormattingConstant.PROGRESS_BAR_EMPTY as string).repeat(
      emptyWidth
    );

    return `${filled}${empty}`;
  }

  private createTimeInfo(
    currentCount: number,
    totalCount: number,
    timerId: string
  ): string {
    const elapsedMilliseconds = queryTimer(timerId).getTime("ms").raw;
    const elapsedSeconds = Math.floor(
      elapsedMilliseconds / FormattingConstant.MILLISECONDS_PER_SECOND
    );
    const elapsedFormatted = this.formatTime(elapsedSeconds);

    let etaText = "";
    const isInProgress = currentCount < totalCount && currentCount > 0;

    if (isInProgress) {
      const remainingMilliseconds =
        (elapsedMilliseconds / currentCount) * (totalCount - currentCount);
      const remainingSeconds = Math.floor(
        remainingMilliseconds / FormattingConstant.MILLISECONDS_PER_SECOND
      );
      const etaFormatted = this.formatTime(remainingSeconds);
      etaText = ` ETA: ${etaFormatted}`;
    }

    return `[${elapsedFormatted}]${etaText}`;
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(
      totalSeconds / FormattingConstant.SECONDS_PER_MINUTE
    );
    const seconds = totalSeconds % FormattingConstant.SECONDS_PER_MINUTE;
    const paddedSeconds = seconds.toString().padStart(2, "0");

    return `${minutes}:${paddedSeconds}`;
  }

  private colorize(text: string, type: LogType | "format"): string {
    const colorMap: Record<LogType | "format", AnsiColor> = {
      success: AnsiColor.SUCCESS,
      info: AnsiColor.INFO,
      warn: AnsiColor.WARN,
      error: AnsiColor.ERROR,
      debug: AnsiColor.DEBUG,
      telemetry: AnsiColor.TELEMETRY,
      format: AnsiColor.FORMAT,
    };

    const color = colorMap[type];
    return `${color}${text}${AnsiColor.RESET}`;
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
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
