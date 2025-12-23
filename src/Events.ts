import express from "express";
import fs from "fs";
import path from "path";

import { BotEventHandler } from "./bot/EventHandler";
import { getDiscordClient, initDiscordClient } from "./clients/DiscordClient";
import { initGrokClient } from "./clients/GrokClient";
import { getRedisClient, initRedisClient } from "./clients/RedisClient";
import { getDbHandler, initDbHandler } from "./db/DbHandler";
import { initFs } from "./helpers/files/FileSystem";
import { getLogger, initLogger } from "./helpers/Logger";
import { startTimer } from "./helpers/Timer";
import { routes } from "./routes";
import { startGlobalRateLimitIncrement, startUserRateLimitIncrements } from "./services/rateLimits";
import { ErrorProne } from "./utils/parentClasses/ErrorProne";

export class Events extends ErrorProne {
    constructor() {
        super();
    }

    static initEssentials() {
        startTimer("main");
        initLogger();
        initFs(JSON.parse(fs.readFileSync(path.join(process.cwd(), "fsconfig.json"), "utf-8")));
    }

    static async initDb() {
        initDbHandler();
        await getDbHandler().init();
    }

    static async initClients() {
        initRedisClient();
        await getRedisClient().connect();
        initGrokClient();
    }

    static async initServices() {
        startGlobalRateLimitIncrement();
        await startUserRateLimitIncrements();
    }

    static async initDiscord() {
        initDiscordClient();
        const client = getDiscordClient().client;
        const eventHandler = new BotEventHandler();

        client.once("clientReady", () => eventHandler.onReady());
        client.on("guildMemberAdd", (member) => eventHandler.onNewMember(member));
        client.on("guildMemberRemove", (member) => eventHandler.onRemoveMember(member));

        await getDiscordClient().connect();
    }

    static async initExpress() {
        const app = express();

        app.use(routes());

        app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            getLogger().simpleLog("error", `Unhandled error: ${err.message}`);
            console.error(err.stack);

            if (!res.headersSent) {
                res.status(500).json({
                    error: "Internal Server Error",
                    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
                });
            }
        });

        return app;
    }
}
