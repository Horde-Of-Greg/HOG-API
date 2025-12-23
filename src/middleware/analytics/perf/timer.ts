import type { NextFunction, Request, Response } from "express";

import { getLogger } from "../../../helpers/Logger";
import { startTimer, stopTimer } from "../../../helpers/Timer";

export const timerStart = (req: Request, res: Response, next: NextFunction) => {
    req.timerId = `req-${Date.now()}`;
    startTimer(req.timerId);

    next();
};

export const timerStop = (req: Request, res: Response, next: NextFunction) => {
    const timing = stopTimer(req.timerId).getTime("ms", 0);

    const endpoint = req.endpoint || "unknown";
    getLogger().simpleLog("telemetry", `Served ${endpoint} in ${timing.formatted}`);

    res.timing = timing;
    next();
};
