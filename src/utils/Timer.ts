let timers: Map<string, Timer> = new Map();

export class Timer {
  startTime;

  constructor() {
    this.startTime = Date.now();
  }

  getTime() {
    return Date.now() - this.startTime;
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
