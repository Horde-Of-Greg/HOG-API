import { initApp } from "./app";
import { getDiscordClient, initDiscordClient } from "./clients/DiscordClient";
import { initGrokClient } from "./clients/GrokClient";
import { getRedisClient, initRedisClient } from "./clients/RedisClient";
import { config, env } from "./config/config";
import { getDbHandler, initDbHandler } from "./db/DbHandler";
import { LEVERET_PUBLIC_KEY } from "./loaders/keys";
import {
  startGlobalRateLimitIncrement,
  startUserRateLimitIncrements,
} from "./services/rateLimits";
import { getLogger, initLogger } from "./utils/Logger";
import { startTimer, stopTimer } from "./utils/Timer";

async function main() {
  startTimer("main");

  initLogger();

  getLogger().formattingLog("Clients Init");
  initRedisClient();
  await getRedisClient().connect();

  initGrokClient();

  initDiscordClient();
  await getDiscordClient().connect();

  getLogger().formattingLog("DB Init");
  initDbHandler();
  await getDbHandler().init();

  startGlobalRateLimitIncrement();
  await startUserRateLimitIncrements();

  getLogger().formattingLog("App Init");
  const app = initApp();

  app.listen(config.PORT, config.RUNNING_IP, () => {
    getLogger().formattingLog("Server Ready");
    getLogger().simpleLog(
      "info",
      `Server is running at http://${config.RUNNING_IP}:${config.PORT}`
    );
    const main_timeTaken_ms = stopTimer("main").getTime();
    getLogger().simpleLog(
      "info",
      `Server took ${main_timeTaken_ms}ms to start`
    );
  });
}

main();
