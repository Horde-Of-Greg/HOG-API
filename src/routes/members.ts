import { Router } from "express";
import { MembersController } from "../controllers/MembersController";
import { membersEndpoint } from "../middleware/endpoints/membersEndpoint";
import { cleanup } from "../middleware/sanity/cleanup";
import { timerStop } from "../middleware/analytics/perf/timer";

export function membersRoutes() {
  const router = Router();
  const controller = new MembersController();

  router.get("/user-ids", membersEndpoint, controller.getIds);
  router.get("/usernames", membersEndpoint, controller.getUsernames);
  router.get("/users", membersEndpoint, controller.getUsers);

  router.use(timerStop);
  router.use(cleanup);

  return router;
}
