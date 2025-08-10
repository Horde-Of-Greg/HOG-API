import { createClient } from "redis";
import { env } from "../config/config";
import { getLogger } from "../utils/Logger";

let redisClient: RedisClient | null = null;

export class RedisClient {
  client: ReturnType<typeof createClient>;

  constructor() {
    this.client = this.buildClient();
    this.connect();
  }

  buildClient() {
    const client = createClient({
      username: env.REDIS_USERNAME,
      password: env.REDIS_PASSWORD,
      socket: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        tls: false,
      },
    });
    client.on("error", (err) =>
      getLogger().simpleLog("error", `Redis Client Error ${err}`)
    );
    return client;
  }

  async connect() {
    try {
      await this.client.connect();
      getLogger().simpleLog("success", "Redis Client Connected Successfully");
    } catch (err) {
      getLogger().simpleLog("error", `Failed to connect to Redis: ${err}`);
    }
  }
}

export function initRedisClient(): RedisClient {
  if (redisClient) return redisClient;
  redisClient = new RedisClient();
  return redisClient;
}

export function getRedisClient(): RedisClient {
  if (!redisClient)
    throw new Error(
      "Redis Client not initialized. Call initRedisClient() first."
    );
  return redisClient;
}
