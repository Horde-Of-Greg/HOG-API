import type { Express } from "express";

import { config } from "./config/config";
import { Events } from "./Events";
import { getLogger } from "./helpers/Logger";
import { stopTimer } from "./helpers/Timer";
import { ErrorProne } from "./utils/parentClasses/ErrorProne";

class Server extends ErrorProne {
    app: Express | null;

    constructor() {
        super();
        this.app = null;
    }

    async main() {
        Events.initEssentials();

        getLogger().formattingLog("Clients Init");
        await Events.initClients();

        getLogger().formattingLog("DB Init");
        await Events.initDb();

        getLogger().formattingLog("Discord Bot Init");
        await Events.initDiscord();

        getLogger().formattingLog("Services Init");
        await Events.initServices();

        getLogger().formattingLog("App Init");
        this.app = await Events.initExpress();
    }
}

const server = new Server();
server.main();

if (!server.app) {
    throw new Error("Critical Error: Could not get express app");
}

server.app.listen(config.PORT, config.RUNNING_IP, () => {
    getLogger().formattingLog("Server Info");
    getLogger().simpleLog("info", `Server is running at http://${config.RUNNING_IP}:${config.PORT}`);
    getLogger().simpleLog(
        "telemetry",
        `Server took ${stopTimer("main").getTime("auto", 3).formatted} to start`,
    );
    getLogger().formattingLog("Server Ready");
});
