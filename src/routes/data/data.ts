import { Router } from "express";
import { setEndpointData } from "../../middleware/setEndpointData";
import { membersRoutes } from "./members/members";

export function dataRoutes() {
  const router = Router();

  router.use("/members", setEndpointData("main", "members"), membersRoutes());

  return router;
}
