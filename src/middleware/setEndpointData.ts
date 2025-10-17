import { Request, Response, NextFunction } from "express";
import {
  getEndpointHandler,
  initEndpointHandler,
  nullifyEndpointHandler,
} from "../utils/Endpoint";
import { EndpointLevel } from "../types/server";
import { getLogger } from "../utils/Logger";

export const setEndpointData = (level: EndpointLevel, data: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      switch (level) {
        case "source":
          initEndpointHandler(data);
          break;

        case "main":
          getEndpointHandler().setMain(data);
          break;

        case "child":
          getEndpointHandler().setChild(data);
          break;
      }
      next();
    } catch (err) {
      getLogger().simpleLog("error", `setEndpointData error: ${err}`);
      res
        .status(500)
        .json({
          error: "Internal Server Error - Endpoint configuration failed",
        });
    }
  };
};
