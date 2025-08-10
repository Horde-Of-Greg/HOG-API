import { User } from "discord.js";
import { getDiscordClient } from "../clients/DiscordClient";
import { string } from "zod";

export async function findDcIdByUsername(
  dcUsername: string
): Promise<string | null> {
  const user = await getDiscordClient().client.users.fetch(dcUsername);
  return user?.id ? user.id : null;
}

export async function findDcUsernameById(dcId: string): Promise<string | null> {
  const user = await getDiscordClient().client.users.fetch(dcId);
  return user?.username ? user.username : null;
}
