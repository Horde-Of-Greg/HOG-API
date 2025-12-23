import { getDbHandler } from "../../db/DbHandler";
import { findDcUsernameById } from "../../utils/bot/usernames";

export class MembersService {
    private db = getDbHandler();

    async getIds(): Promise<string[]> {
        return this.db.getHogMembers();
    }

    async getUsernames(): Promise<string[]> {
        const ids = await this.db.getHogMembers();
        const usernames = await Promise.all(ids.map((id) => findDcUsernameById(id)));
        return usernames.filter((name): name is string => name !== null);
    }

    async getUsers(): Promise<Record<string, string>> {
        const ids = await this.db.getHogMembers();
        const result: Record<string, string> = {};

        await Promise.all(
            ids.map(async (id) => {
                const username = await findDcUsernameById(id);
                result[id] = username || "unknown";
            }),
        );

        return result;
    }
}
