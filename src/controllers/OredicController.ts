import { Request, Response, NextFunction } from "express";
import { OredicService } from "../services/oredic/OredicService";

export class OredicController {
  private service = new OredicService();

  simplify = async (req: Request, res: Response, next: NextFunction) => {
    const { pack, action } = req.oredic || {};

    if (!pack || !action) {
      return next(new Error("Pack or action is missing"));
    }

    try {
      const result = await this.service.simplify(req.body.string, pack);
      res.data = { ast: result.data };
      next();
    } catch (error) {
      next(error);
    }
  };
}
