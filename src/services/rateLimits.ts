import { config } from "../config/config";
import { getDbHandler } from "../db/DbHandler";
import { getRedisClient } from "../clients/RedisClient";
import { getLogger } from "../utils/Logger";

let globalRateLimitInterval: NodeJS.Timeout | null = null;
let userRateLimitInterval: NodeJS.Timeout | null = null;

export function startGlobalRateLimitIncrement() {
  if (globalRateLimitInterval) return;

  const intervalMs = config.RATE_LIMIT.GLOBAL.INTERVAL * 1000;

  globalRateLimitInterval = setInterval(async () => {
    try {
      await getDbHandler().updateGlobalRates("give");
    } catch (err) {
      getLogger().simpleLog(
        "error",
        `Failed to increment global rates: ${err}`
      );
    }
  }, intervalMs);

  getLogger().simpleLog(
    "success",
    `Global rate limit increment started (every ${config.RATE_LIMIT.GLOBAL.INTERVAL}s)`
  );
}

export async function startUserRateLimitIncrements() {
  if (userRateLimitInterval) return;

  const intervalMs = config.RATE_LIMIT.USER.INTERVAL * 1000;

  userRateLimitInterval = setInterval(async () => {
    try {
      const keys = await getRedisClient().client.keys("*");
      const userIds = keys.filter((key) => key !== "GlobalRates");

      for (const userId of userIds) {
        if (config.RATE_LIMIT.USER.WHITELIST.includes(userId)) continue;

        await getDbHandler().updateUserRates(userId, "give");
      }
    } catch (err) {
      getLogger().simpleLog("error", `Failed to increment user rates: ${err}`);
    }
  }, intervalMs);

  getLogger().simpleLog(
    "success",
    `User rate limit increment started (every ${config.RATE_LIMIT.USER.INTERVAL}s)`
  );
}

export function stopGlobalRateLimitIncrement() {
  if (globalRateLimitInterval) {
    clearInterval(globalRateLimitInterval);
    globalRateLimitInterval = null;
    getLogger().simpleLog("info", "Global rate limit increment stopped");
  }
}

export function stopUserRateLimitIncrements() {
  if (userRateLimitInterval) {
    clearInterval(userRateLimitInterval);
    userRateLimitInterval = null;
    getLogger().simpleLog("info", "User rate limit increments stopped");
  }
}
