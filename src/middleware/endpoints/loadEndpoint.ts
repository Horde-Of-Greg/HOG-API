import type { NextFunction, Request, Response } from "express";

export const loadEndpoint = (req: Request, res: Response, next: NextFunction) => {
    const endpoint = `${req.baseUrl}${req.path}`;
    req.endpoint = endpoint;

    next();
};
