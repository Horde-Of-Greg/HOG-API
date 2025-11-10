import { RequestHandler, Request, Response, NextFunction } from "express";
import { Ae2uelOredicParser } from "../utils/parsers/Oredic";
import { getLogger } from "../utils/Logger";

export class OredicController {
  constructor() {}

  async answer(req: Request) {
    const Parser = new Ae2uelOredicParser(req.body.string);
    return Parser.parse();
  }

  handler =
    (): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
      res.json({ ast: await this.answer(req) });
    };
}
