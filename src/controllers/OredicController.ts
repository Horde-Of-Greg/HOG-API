import type { NextFunction, Request, Response } from "express";

import type { OredicPack } from "../config/routes";
import { OredicService } from "../services/oredic/OredicService";
import { assertOredicRequest } from "../types/express";
import { ErrorProne } from "../utils/parentClasses/ErrorProne";

export class OredicController extends ErrorProne {
    constructor() {
        super();
    }

    parse = async (req: Request, res: Response, next: NextFunction) => {
        assertOredicRequest(req);
        const service = this.initializeService(req.oredic.pack);
        const filter = req.body.filter;

        if (!filter) {
            this.setError(
                500,
                "Received no filter in OredicController. Should have been validated properly first.",
            );
            res.status(this.getErrorCode()).send(this.sendErrorToClient());
            return;
        }

        const parsed = await service.parse(filter);
        if (this.isError(parsed)) {
            this.propagateError(parsed, "Could not parse", "OredicController");
            res.status(this.getErrorCode()).send(this.sendErrorToClient());
            return;
        }

        res.data = { ast: parsed };
    };

    build = async (req: Request, res: Response, next: NextFunction) => {
        assertOredicRequest(req);
        const service = this.initializeService(req.oredic.pack);
    };

    match = async (req: Request, res: Response, next: NextFunction) => {
        assertOredicRequest(req);
        const service = this.initializeService(req.oredic.pack);
    };

    simplify = async (req: Request, res: Response, next: NextFunction) => {
        assertOredicRequest(req);
        const service = this.initializeService(req.oredic.pack);
    };

    initializeService(pack: OredicPack) {
        return new OredicService(pack);
    }
}
