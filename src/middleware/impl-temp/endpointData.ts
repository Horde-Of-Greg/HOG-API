import { Request, Response, NextFunction } from "express";
import { SystemPromptChoice } from "../types/grok";
import { EndpointConfig } from "../types/server";
import { getEndpointHandler, nullifyEndpointHandler } from "../utils/Endpoint";
import { config } from "../config/config";
import { getLogger } from "../utils/Logger";

declare global {
  namespace Express {
    interface Request {
      endpointConfig?: EndpointConfig;
    }
  }
}

export const endpointData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const endpointHandler = getEndpointHandler();
    const source = endpointHandler.getSource();
    const mainEndpoint = endpointHandler.getMain();
    const child = endpointHandler.getChild();

    switch (source) {
      case "leveret":
        let endpointSpecificConfig;
        if (mainEndpoint) {
          const configEntry = config.ENDPOINTS[mainEndpoint];
          if (configEntry) {
            endpointSpecificConfig = {
              endpointName: mainEndpoint,
              systemPrompt: (child as SystemPromptChoice) || "default",
              model: configEntry.MODEL,
              maxPromptTokens: configEntry.MAX_PROMPT_TK,
              maxContextTokens: configEntry.MAX_CONTEXT_TK,
              maxTotalTokens: configEntry.MAX_TOTAL_TK,
              filters: configEntry.FILTERS,
              rateLimit: configEntry.RATE_LIMIT,
            };
          } else {
            getLogger().simpleLog(
              "warn",
              `No config found for endpoint: ${mainEndpoint}`
            );
          }
        }

        req.endpointConfig = {
          source: endpointHandler.getSource(),
          main: mainEndpoint,
          child: child,
          config: endpointSpecificConfig,
        };
        break;

      case "data":
        req.endpointConfig = {
          source: source,
          main: mainEndpoint,
          child: child,
        };
        break;
    }

    nullifyEndpointHandler();
    next();
  } catch (err) {
    getLogger().simpleLog("error", `endpointData error: ${err}`);
    next(err);
  }
};
