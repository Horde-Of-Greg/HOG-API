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
    await this.createGlobalRatesForAllEndpoints();
  }

  async createGlobalRatesForAllEndpoints() {
    for (const [endpointName, endpointConfig] of Object.entries(
      config.ENDPOINTS
    )) {
      await this.client.set(
        `${endpointName}:GlobalRates`,
        endpointConfig.RATE_LIMIT.GLOBAL.MAX_STORED
      );
      getLogger().simpleLog(
        "success",
        `Global Rates Initialized for ${endpointName}`
      );
    }
  }

  async createUser(discordId: string, endpointName: string, maxStored: number) {
    const username = await findDcUsernameById(discordId);
    if (!username) {
      getLogger().simpleLog(
        "warn",
        `Could not find discord username for ${discordId}`
      );
      return false;
    }
    await this.client.hSet(`${endpointName}:user:${discordId}`, {
      username: username,
      rates: maxStored,
    });
    return true;
  }

  async getGlobalRates(endpointName: string) {
    const rates = await this.client.get(`${endpointName}:GlobalRates`);
    if (!rates) {
      getLogger().simpleLog(
        "warn",
        `Error Fetching Global Rates for ${endpointName}`
      );
      return null;
    }
    return parseInt(rates);
  }

  async getUsername(discordId: string, endpointName: string) {
    const userData = await this.getUserData(discordId, endpointName);
    if (!userData.username) {
      throw new Error(`No username found for Discord ID: ${discordId}`);
    }
    return userData.username;
  }

  async getUserRates(discordId: string, endpointName: string) {
    const userData = await this.getUserData(discordId, endpointName);
    if (!userData.rates) {
      throw new Error(
        `No rates found for Discord ID: ${discordId} on ${endpointName}`
      );
    }
    return parseInt(userData.rates);
  }

  async updateGlobalRates(endpointName: string, type: "give" | "take") {
    const rates = await this.getGlobalRates(endpointName);
    if (rates === null) return;
    const globalConfig = config.ENDPOINTS[endpointName].RATE_LIMIT.GLOBAL;
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

    await this.client.set(`${endpointName}:GlobalRates`, newRates);
  }

  async updateUserRates(
    discordId: string,
    endpointName: string,
    type: "give" | "take"
  ) {
    const rates = await this.getUserRates(discordId, endpointName);
    const userConfig = config.ENDPOINTS[endpointName].RATE_LIMIT.USER;
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

    await this.client.hSet(
      `${endpointName}:user:${discordId}`,
      "rates",
      newRates
    );
  }

  async getUserData(discordId: string, endpointName: string) {
    const key = `${endpointName}:user:${discordId}`;
    const exists = !!(await this.client.exists(key));
    if (!exists) {
      const maxStored =
        config.ENDPOINTS[endpointName].RATE_LIMIT.USER.MAX_STORED;
      const created = await this.createUser(discordId, endpointName, maxStored);
      if (!created) {
        throw new Error(
          `Failed to create user for Discord ID: ${discordId} on ${endpointName}`
        );
      }
    }
    return await this.client.hGetAll(key);
  }

  async getAllUserKeysForEndpoint(endpointName: string) {
    const pattern = `${endpointName}:user:*`;
    return await this.client.keys(pattern);
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
