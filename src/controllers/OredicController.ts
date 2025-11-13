import { RequestHandler, Request, Response, NextFunction } from "express";
import { Ae2uelOredicParser } from "../utils/parsers/OredicAe2";
import { getLogger } from "../utils/Logger";
import { OredicMatcher } from "../utils/parsers/OredicMatcher";

export class OredicController {
  constructor() {}

  async answer(req: Request) {
    const Parser = new Ae2uelOredicParser(req.body.string);
    const rules = Parser.parse();
    if (!rules) {
      // Catch unknown error
      return;
    }
    if (rules.type === "error") {
      // Catch error according to the metadata
      return;
    }

    const Matcher = new OredicMatcher(rules, "nomi-ceu");
    return Matcher.ast;
  }

  handler =
    (): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
      res.json({ ast: await this.answer(req) });
    };
}
