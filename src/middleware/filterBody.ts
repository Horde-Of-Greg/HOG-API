import { Request, Response, NextFunction } from "express";
import { filtersConfig } from "../config/config";
import { FILTERS } from "../loaders/filters";
import { getLogger } from "../utils/Logger";
import { getDbHandler } from "../db/DbHandler";

//TODO: Make the config a map for Severity -> Action, and handle that.
export const filterBody = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const prompt = req.body.prompt;
  const context = req.body.context;
  const username = await getDbHandler().getUsername(req.body.userId);

  switch (filtersConfig.grok.filterAction) {
    case "warn":
      filterAndWarn(prompt, username);
      filterAndWarn(context, username);
      next();
      break;
    case "replace":
      req.body.prompt = filterAndReplace(prompt, username);
      req.body.context = filterAndReplace(context, username);
      next();
      break;
    case "block":
      const promptBlocked = filterAndBlock(prompt, username);
      const contextBlocked = filterAndBlock(context, username);

      if (!promptBlocked || !contextBlocked) {
        res.status(403).json({
          error: "Content Violation",
          message: filtersConfig.grok.customMessage,
        });
        return;
      }
      next();
      break;
  }
};

function filterAndWarn(text: string, username: string) {
  FILTERS.forEach((filter) => {
    if (filter.pattern.test(text)) {
      getLogger().simpleLog(
        "warn",
        `${filter.description} (${filter.severity}) - User: ${username}`
      );
    }
  });
}

function filterAndReplace(text: string, username: string): string {
  let result = text;
  FILTERS.forEach((filter) => {
    if (filter.pattern.test(result)) {
      getLogger().simpleLog(
        "warn",
        `${filter.description} (${filter.severity}) - User: ${username}`
      );
      result = result.replace(filter.pattern, "[removed]");
    }
  });
  return result;
}

function filterAndBlock(text: string, username: string): boolean {
  for (const filter of FILTERS) {
    if (filter.pattern.test(text)) {
      getLogger().simpleLog(
        "warn",
        `BLOCKED: ${filter.description} (${filter.severity}) - User: ${username}`
      );
      return false;
    }
  }
  return true;
}
