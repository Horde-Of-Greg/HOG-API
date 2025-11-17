import { TimerRes } from "../types/timer";

let timers: Map<string, Timer> = new Map();

export class Timer {
  startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  getTime(
    unit: "micro" | "ms" | "s" | "m" | "auto" = "auto",
    precision: number = 2
  ): TimerRes {
    const timeTaken_ms = performance.now() - this.startTime;
    let adjustedTime: number = 0;
    let unitLabel: string = "";

    switch (unit) {
      case "auto":
        if (timeTaken_ms < 1) {
          adjustedTime = timeTaken_ms * 1000;
          unitLabel = "μs";
        } else if (timeTaken_ms < 1000) {
          adjustedTime = timeTaken_ms;
          unitLabel = "ms";
        } else if (timeTaken_ms < 60000) {
          adjustedTime = timeTaken_ms / 1000;
          unitLabel = "s";
        } else {
          adjustedTime = timeTaken_ms / 60000;
          unitLabel = "m";
        }
        break;

      case "micro":
        adjustedTime = timeTaken_ms * 1000;
        unitLabel = "μs";
        break;

      case "ms":
        adjustedTime = timeTaken_ms;
        unitLabel = "ms";
        break;

      case "s":
        adjustedTime = timeTaken_ms / 1000;
        unitLabel = "s";
        break;

      case "m":
        adjustedTime = timeTaken_ms / 60000;
        unitLabel = "m";
        break;
    }

    const formattedTime = `${adjustedTime.toFixed(precision)}${unitLabel}`;

    return {
      raw: timeTaken_ms,
      adjusted: adjustedTime,
      formatted: formattedTime,
    };
  }
}

export function startTimer(id: string): void {
  if (!timers.get(id)) timers.set(id, new Timer());
}

export function stopTimer(id: string): Timer {
  const time = timers.get(id);
  if (!time)
    throw new Error(
      `Timer ${id} not initialized. Call startTimer(id:string) first.`
    );
  timers.delete(id);
  return time;
}

export function queryTimer(id: string): Timer {
  const time = timers.get(id);
  if (!time)
    throw new Error(
      `Timer ${id} not initialized. Call startTimer(id:string) first.`
    );
  return time;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
