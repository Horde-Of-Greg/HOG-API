import { NextFunction, Response, Request } from "express";
import { getLogger } from "../utils/Logger";
import { getDbHandler } from "../db/DbHandler";

export const cleanup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.endpointConfig?.source !== "leveret") {
        getLogger().simpleLog("info", "Request processed");
        next();
        return;
    }

    const endpointConfig = req.endpointConfig?.config;

    if (!endpointConfig) {
        res.status(500).json({ error: "Endpoint configuration not found" });
        return;
    }

    const userId = req.body.userId;
    await getDbHandler().updateGlobalRates(endpointConfig.endpointName, "take");
    await getDbHandler().updateUserRates(userId, endpointConfig.endpointName, "take");

    getLogger().simpleLog("info", "Authorized Request");
    next();
};
