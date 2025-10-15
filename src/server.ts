import { initApp } from "./app";
import { getDiscordClient, initDiscordClient } from "./clients/DiscordClient";
import { initGrokClient } from "./clients/GrokClient";
import { getRedisClient, initRedisClient } from "./clients/RedisClient";
import { config } from "./config/config";
import { getDbHandler, initDbHandler } from "./db/DbHandler";
import {
  startGlobalRateLimitIncrement,
  startUserRateLimitIncrements,
} from "./services/rateLimits";
import { getLogger, initLogger } from "./utils/Logger";

async function main() {
  initLogger();

  initRedisClient();
  await getRedisClient().connect();

  initGrokClient();

  initDiscordClient();
  await getDiscordClient().connect();

  initDbHandler();
  await getDbHandler().init();

  startGlobalRateLimitIncrement();
  await startUserRateLimitIncrements();

  const app = initApp();

  app.listen(config.PORT, config.RUNNING_IP, () => {
    getLogger().simpleLog(
      "success",
      `Server is running at http://${config.RUNNING_IP}:${config.PORT}`
    );
  });
}

main();
