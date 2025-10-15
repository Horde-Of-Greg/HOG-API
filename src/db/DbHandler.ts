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

  async init() {
    await this.createGlobalRates();
  }

  async createGlobalRates() {
    await this.client.set("GlobalRates", config.RATE_LIMIT.GLOBAL.MAX_STORED);
    getLogger().simpleLog("success", "Global Rates Initialized");
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

  async getGlobalRates() {
    const rates = await this.client.get("GlobalRates");
    if (!rates) {
      getLogger().simpleLog("warn", "Error Fetching Global Rates");
      return null;
    }
    return parseInt(rates);
  }

  async getUsername(discordId: string) {
    const userData = await this.getUserData(discordId);
    if (!userData.username) {
      throw new Error(`No username found for Discord ID: ${discordId}`);
    }
    return userData.username;
  }

  async getUserRates(discordId: string) {
    const userData = await this.getUserData(discordId);
    if (!userData.rates) {
      throw new Error(`No rates found for Discord ID: ${discordId}`);
    }
    return parseInt(userData.rates);
  }

  async updateGlobalRates(type: "give" | "take") {
    const rates = await this.getGlobalRates();
    if (!rates) return;
    const globalConfig = config.RATE_LIMIT.GLOBAL;
    let newRates: number;
    let tmpRates: number;

    switch (type) {
      case "give":
        tmpRates = rates + globalConfig.AMOUNT;
        newRates =
          tmpRates >= globalConfig.MAX_STORED
            ? globalConfig.MAX_STORED
            : tmpRates;
        break;
      case "take":
        tmpRates = rates - 1;
        newRates = tmpRates <= 0 ? 0 : tmpRates;
        break;
    }

    await this.client.set("GlobalRates", newRates);
  }

  async updateUserRates(discordId: string, type: "give" | "take") {
    const rates = await this.getUserRates(discordId);
    const userConfig = config.RATE_LIMIT.USER;
    let newRates: number;
    let tmpRates: number;

    switch (type) {
      case "give":
        tmpRates = rates + userConfig.AMOUNT;
        newRates =
          tmpRates >= userConfig.MAX_STORED ? userConfig.MAX_STORED : tmpRates;
        break;
      case "take":
        tmpRates = rates - 1;
        newRates = tmpRates <= 0 ? 0 : tmpRates;
        break;
    }

    await this.client.hSet(discordId, "rates", newRates);
  }

  async getUserData(discordId: string) {
    const exists = !!(await this.client.exists(discordId));
    if (!exists) {
      const created = await this.createUser(discordId);
      if (!created) {
        throw new Error(`Failed to create user for Discord ID: ${discordId}`);
      }
    }
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
