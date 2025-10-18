import { GuildMember, PartialGuildMember, Guild } from "discord.js";
import { getDiscordClient } from "../clients/DiscordClient";
import { getLogger } from "../utils/Logger";
import { config, env } from "../config/config";
import { getDbHandler } from "../db/DbHandler";
import { findDcUsernameById } from "../utils/bot/usernames";

export class BotEventHandler {
  client;
  guild: Guild | null = null;
  dbHandler;

  constructor() {
    this.client = getDiscordClient().client;
    this.dbHandler = getDbHandler();
  }

  private async ensureGuild(): Promise<Guild> {
    if (this.guild) return this.guild;

    const guild = this.client.guilds.cache.get(env.SERVER_ID);
    if (!guild) {
      throw new Error(`Failed to fetch Server ID: ${env.SERVER_ID}`);
    }

    this.guild = guild;
    return guild;
  }

  async onReady() {
    const guild = await this.ensureGuild();

    getLogger().simpleLog(
      "info",
      `Discord Bot ready as ${this.client.user?.tag}`
    );

    const members = await guild.members.fetch();
    let memberIds: string[] = [];

    members.forEach((value, key) => {
      memberIds.push(key);
    });

    this.dbHandler.createHog(memberIds);
  }

  async onNewMember(member: GuildMember | PartialGuildMember) {
    const memberId = member.id;
    this.dbHandler.addToHog(memberId);
    getLogger().simpleLog(
      "info",
      `${await findDcUsernameById(memberId)} joined ${
        config.DISCORD_SERVER_NAME
      }`
    );
  }

  async onRemoveMember(member: GuildMember | PartialGuildMember) {
    const memberId = member.id;
    this.dbHandler.removeFromHog(memberId);
    getLogger().simpleLog(
      "warn",
      `${await findDcUsernameById(memberId)} left ${config.DISCORD_SERVER_NAME}`
    );
  }
}
