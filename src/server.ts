import { initApp } from "./app";
import { initDiscordClient } from "./clients/DiscordClient";
import { initGrokClient } from "./clients/GrokClient";
import { getRedisClient, initRedisClient } from "./clients/RedisClient";
import { config } from "./config/config";
import { initDbHandler } from "./db/DbHandler";
import { getLogger, initLogger } from "./utils/Logger";

async function main() {
  initLogger();

  initRedisClient();
  initGrokClient();
  initDiscordClient();
  initDbHandler();

  const app = initApp();

  app.listen(config.PORT, config.RUNNING_IP, () => {
    getLogger().simpleLog(
      "success",
      `Server is running at http://${config.RUNNING_IP}:${config.PORT}`
    );
  });
}

main();
