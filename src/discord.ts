import { BotEventHandler } from "./bot/EventHandler";
import { initDiscordClient, getDiscordClient } from "./clients/DiscordClient";

export async function initDiscord() {
  initDiscordClient();
  const client = getDiscordClient().client;
  const eventHandler = new BotEventHandler();

  client.once("clientReady", () => eventHandler.onReady());
  client.on("guildMemberAdd", (member) => eventHandler.onNewMember(member));
  client.on("guildMemberRemove", (member) =>
    eventHandler.onRemoveMember(member)
  );

  await getDiscordClient().connect();
}
