import { config } from "../config/config";
import { getDbHandler } from "../db/DbHandler";
import { getRedisClient } from "../clients/RedisClient";
import { getLogger } from "../utils/Logger";

const rateLimitIntervals: Map<string, NodeJS.Timeout> = new Map();

export function startGlobalRateLimitIncrement() {
  for (const [endpointName, endpointConfig] of Object.entries(
    config.ENDPOINTS
  )) {
    if (rateLimitIntervals.has(`${endpointName}:global`)) continue;

    const intervalMs = endpointConfig.RATE_LIMIT.GLOBAL.INTERVAL * 1000;

    const interval = setInterval(async () => {
      try {
        await getDbHandler().updateGlobalRates(endpointName, "give");
      } catch (err) {
        getLogger().simpleLog(
          "error",
          `Failed to increment global rates for ${endpointName}: ${err}`
        );
      }
    }, intervalMs);

    rateLimitIntervals.set(`${endpointName}:global`, interval);

    getLogger().simpleLog(
      "success",
      `Global rate limit increment started for ${endpointName} (every ${endpointConfig.RATE_LIMIT.GLOBAL.INTERVAL}s)`
    );
  }
}

export async function startUserRateLimitIncrements() {
  for (const [endpointName, endpointConfig] of Object.entries(
    config.ENDPOINTS
  )) {
    if (rateLimitIntervals.has(`${endpointName}:user`)) continue;

    const intervalMs = endpointConfig.RATE_LIMIT.USER.INTERVAL * 1000;

    const interval = setInterval(async () => {
      try {
        const keys = await getDbHandler().getAllUserKeysForEndpoint(
          endpointName
        );

        for (const key of keys) {
          // Extract userId from key: "endpointName:user:userId"
          const userId = key.split(":")[2];
          if (!userId) continue;

          if (endpointConfig.RATE_LIMIT.USER.WHITELIST.includes(userId))
            continue;

          await getDbHandler().updateUserRates(userId, endpointName, "give");
        }
      } catch (err) {
        getLogger().simpleLog(
          "error",
          `Failed to increment user rates for ${endpointName}: ${err}`
        );
      }
    }, intervalMs);

    rateLimitIntervals.set(`${endpointName}:user`, interval);

    getLogger().simpleLog(
      "success",
      `User rate limit increment started for ${endpointName} (every ${endpointConfig.RATE_LIMIT.USER.INTERVAL}s)`
    );
  }
}

export function stopGlobalRateLimitIncrement() {
  for (const [key, interval] of rateLimitIntervals.entries()) {
    if (key.endsWith(":global")) {
      clearInterval(interval);
      rateLimitIntervals.delete(key);
      const endpointName = key.replace(":global", "");
      getLogger().simpleLog(
        "info",
        `Global rate limit increment stopped for ${endpointName}`
      );
    }
  }
}

export function stopUserRateLimitIncrements() {
  for (const [key, interval] of rateLimitIntervals.entries()) {
    if (key.endsWith(":user")) {
      clearInterval(interval);
      rateLimitIntervals.delete(key);
      const endpointName = key.replace(":user", "");
      getLogger().simpleLog(
        "info",
        `User rate limit increments stopped for ${endpointName}`
      );
    }
  }
}
