import { Request, Response, NextFunction } from "express";
import {
  OREDIC_PACKS,
  OREDIC_ACTIONS,
  OredicPack,
  OredicAction,
} from "../../config/routes";
import "../../types/express";

export const oredicEndpoint = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
