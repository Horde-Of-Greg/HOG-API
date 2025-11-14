import { RequestHandler, Request, Response, NextFunction } from "express";
import { OredicParser } from "../utils/parsers/OredicParser";
import { OredicMatcher } from "../utils/parsers/OredicMatcher";

export class OredicController {
  constructor() {}

  async answer(req: Request) {
    const Parser = new OredicParser();
    const rules = Parser.parse(req.body.string);
    if (!rules) {
      // Catch unknown error
      return;
    }
    if (rules.type === "error") {
      // Catch error according to the metadata
      return;
    }

    const Matcher = new OredicMatcher(rules, "nomi-ceu");
    return Matcher.match();
  }

  handler =
    (): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
      res.json({ ast: await this.answer(req) });
    };
}
