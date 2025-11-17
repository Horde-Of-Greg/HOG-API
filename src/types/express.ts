import {
  AiModel,
  SystemPrompt,
  OredicPack,
  OredicAction,
} from "../config/routes";
import { TimerRes } from "./timer";
import { ChatCompletion } from "openai/resources/index";
import { exAst } from "./parsing";

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
  ast?: exAst;
  matches?: string[];
  bestFilter?: {
    string: string;
  };
};

export {};
