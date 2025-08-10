import { getRedisClient } from "../clients/RedisClient";
import { config } from "../config/config";
import { findDcUsernameById } from "../utils/discordUtil";
import { getLogger } from "../utils/Logger";

let dbHandler: DbHandler | null = null;

export class DbHandler {
  client;

  constructor() {
    this.client = getRedisClient().client;
  }

  async createUser(discordId: string) {
    const username = await findDcUsernameById(discordId);
    if (!username) {
      getLogger().simpleLog(
        "warn",
        `Could not find discord username for ${discordId}`
      );
      return false;
    }
    await this.client.hSet(discordId, {
      username: username,
      rates: config.RATE_LIMIT.USER.MAX_STORED,
    });
    return true;
  }

  async getUsername(discordId: string) {
    const userData = await this.getUserData(discordId);
    return userData.username;
  }

  async getUserRates(discordId: string) {
    const userData = await this.getUserData(discordId);
    return parseInt(userData.rates);
  }

  async updateUserRates(discordId: string, type: "give" | "take") {
    const rates = await this.getUserRates(discordId);
    const userConfig = config.RATE_LIMIT.USER;
    let newRates: number;
    switch (type) {
      case "give":
        newRates = rates + userConfig.AMOUNT;
        return newRates >= userConfig.MAX_STORED
          ? userConfig.MAX_STORED
          : newRates;
      case "take":
        newRates = rates - 1;
        return newRates <= 0 ? 0 : newRates;
    }
  }

  async getUserData(discordId: string) {
    const exists = !!(await this.client.exists(discordId));
    if (!exists) await this.createUser(discordId);
    return await this.client.hGetAll(discordId);
  }
}

export function initDbHandler(): DbHandler {
  if (dbHandler) return dbHandler;
  dbHandler = new DbHandler();
  return dbHandler;
}

export function getDbHandler(): DbHandler {
  if (!dbHandler)
    throw new Error("Db Handler not initialized. Call initDbHandler() first.");
  return dbHandler;
}
