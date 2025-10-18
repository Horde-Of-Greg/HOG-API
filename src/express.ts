import express from "express";
import { getLogger } from "./utils/Logger";
import { routes } from "./routes";

export function initExpress() {
  const app = express();

  app.use(routes());

  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      getLogger().simpleLog("error", `Unhandled error: ${err.message}`);
      console.error(err.stack);

      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal Server Error",
          message:
            process.env.NODE_ENV === "development"
              ? err.message
              : "Something went wrong",
        });
      }
    }
  );

  getLogger().simpleLog("success", "Express App Initialized Successfully");
  return app;
}
