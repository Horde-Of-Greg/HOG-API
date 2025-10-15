import { Client, GatewayIntentBits } from "discord.js";
import { getLogger } from "../utils/Logger";
import { env } from "../config/config";

let discordClient: DiscordClient | null = null;

export class DiscordClient {
  client: Client;

  constructor() {
    this.client = this.buildClient();
  }

  static gatewayIntents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ];

  buildClient() {
    return new Client({
      intents: DiscordClient.gatewayIntents,
    });
  }

  async connect() {
    try {
      await this.client.login(env.DISCORD_BOT_TOKEN);
      getLogger().simpleLog("success", "Discord Client Connected Successfully");
    } catch (err) {
      getLogger().simpleLog("error", `Failed to connect to Discord: ${err}`);
    }
  }
}

export function initDiscordClient(): DiscordClient {
  if (discordClient) return discordClient;
  discordClient = new DiscordClient();
  return discordClient;
}

export function getDiscordClient(): DiscordClient {
  if (!discordClient)
    throw new Error(
      "Discord Client not initialized. Call initDiscordClient() first."
    );
  return discordClient;
}
