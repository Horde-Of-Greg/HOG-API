import type { Request } from "express";
import type { ChatCompletion } from "openai/resources/index";

import type { AiModel, OredicAction, OredicPack, SystemPrompt } from "../config/routes";
import type { AstNode, OredicMatches } from "./parsing";
import type { TimerRes } from "./timer";

declare global {
    namespace Express {
        interface Request {
            timerId: string;
            endpoint?: string;
            flags?: {
                isLeveret?: boolean;
            };
            ai?: {
                model?: AiModel;
                systemPrompt?: SystemPrompt;
            };
            oredic?: {
                pack?: OredicPack;
                action?: OredicAction;
            };
        }
    }
}

declare global {
    namespace Express {
        interface Response {
            data: AiData | MembersData | OredicData;
            timing: TimerRes;
        }
    }
}

export type AiData = ChatCompletion;
export type MembersData = {
    users?: Record<string, string>;
    ids?: string[];
    usernames?: string[];
};
export type OredicData = {
    ast?: AstNode;
    matches?: OredicMatches;
    bestFilter?: {
        ast: AstNode;
        string: string;
    };
};

// Request type helpers for controllers
export type OredicRequestBody = {
    filter?: string;
    ast?: AstNode;
    matches?: string[];
};

export type OredicRequest = Request<{}, any, OredicRequestBody> & {
    oredic: {
        pack: OredicPack;
        action: OredicAction;
    };
};

export function assertOredicRequest(req: Request): asserts req is OredicRequest {
    const r = req as any;
    if (!r.oredic?.pack || !r.oredic?.action) {
        throw new Error("Invalid request: missing oredic context");
    }
}

export {};
