import "../../types/express";

import type { NextFunction, Request, Response } from "express";

import type { OredicAction, OredicPack } from "../../config/routes";
import { OREDIC_ACTIONS, OREDIC_PACKS } from "../../config/routes";

export const oredicEndpoint = (req: Request, res: Response, next: NextFunction) => {
    const { pack, action } = req.params;

    const isValidPack = OREDIC_PACKS.includes(pack as OredicPack);
    if (!isValidPack) {
        res.status(404).json({
            error: "Invalid pack",
            message: `Pack must be one of: ${OREDIC_PACKS.join(", ")}`,
        });
        return;
    }

    const isValidAction = OREDIC_ACTIONS.includes(action as OredicAction);
    if (!isValidAction) {
        res.status(404).json({
            error: "Invalid action",
            message: `Action must be one of: ${OREDIC_ACTIONS.join(", ")}`,
        });
        return;
    }

    req.oredic = {
        pack: pack as OredicPack,
        action: action as OredicAction,
    };

    next();
};
