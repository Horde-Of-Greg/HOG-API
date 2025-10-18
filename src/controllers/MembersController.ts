import { RequestHandler, Request, Response, NextFunction } from "express";
import { getDbHandler } from "../db/DbHandler";
import { findDcUsernameById } from "../utils/bot/usernames";
import { startTimer, stopTimer } from "../utils/Timer";
import { getLogger } from "../utils/Logger";

export class MembersController {
  dbHandler;

  constructor() {
    this.dbHandler = getDbHandler();
  }

  async getIds() {
    return await this.dbHandler.getHogMembers();
  }

  async getUsernames() {
    const idsList = await this.dbHandler.getHogMembers();
    const usernamesList = await Promise.all(
      idsList.map(async (memberId) => {
        return await findDcUsernameById(memberId);
      })
    );
    return usernamesList;
  }

  async getUsernamesAndIds() {
    const idsList = await this.dbHandler.getHogMembers();
    const idsToUsernames = new Map<string, string>();
    await Promise.all(
      idsList.map(async (element) => {
        const username = await findDcUsernameById(element);
        if (username) {
          idsToUsernames.set(element, username);
        } else {
          idsToUsernames.set(element, "unknown");
        }
      })
    );

    return idsToUsernames;
  }

  handler =
    (): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
      const endpointConfig = req.endpointConfig;

      if (!endpointConfig) {
        next(new Error("Endpoint configuration is missing"));
        return;
      }
      const toFetch = endpointConfig.child;

      let members: any;
      startTimer("members-fetch");
      try {
        switch (toFetch) {
          case "ids":
            members = await this.getIds();
            break;
          case "usernames":
            members = await this.getUsernames();
            break;
          case "usernames-and-ids":
            members = await this.getUsernamesAndIds();
            break;
        }
        const time_taken_ms = stopTimer("members-fetch").getTime();
        getLogger().simpleLog(
          "info",
          `Served Request on ${endpointConfig.main} in ${time_taken_ms}ms`
        );
        res.json({ members: members, duration: time_taken_ms });
      } catch (err) {
        next(err);
      }
    };
}
