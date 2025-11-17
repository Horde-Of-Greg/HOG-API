import { Request, Response, NextFunction } from "express";
import { startTimer, stopTimer } from "../../../utils/Timer";
import { getLogger } from "../../../utils/Logger";

export const timerStart = (req: Request, res: Response, next: NextFunction) => {
  req.timerId = `req-${Date.now()}`;
  startTimer(req.timerId);

  next();
};

export const timerStop = (req: Request, res: Response, next: NextFunction) => {
  const timing = stopTimer(req.timerId).getTime("ms", 0);

  const endpoint = req.endpoint || "unknown";
  getLogger().simpleLog(
    "telemetry",
    `Served ${endpoint} in ${timing.formatted}`
  );

  res.timing = timing;
  next();
};
