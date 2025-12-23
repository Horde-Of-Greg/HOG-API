import "../../types/express";

import type { NextFunction, Request, Response } from "express";

export const membersEndpoint = (req: Request, res: Response, next: NextFunction) => {
    next();
};
