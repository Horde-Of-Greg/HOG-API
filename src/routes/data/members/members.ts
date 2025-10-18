import { Router } from "express";
import { confirmation } from "../../../middleware/confirmation";
import { endpointData } from "../../../middleware/endpointData";
import { setEndpointData } from "../../../middleware/setEndpointData";
import { MembersController } from "../../../controllers/MembersController";

export function membersRoutes() {
  const router = Router();
  const controller = new MembersController();

  router.get(
    "/ids",
    setEndpointData("child", "ids"),
    endpointData,
    confirmation,
    controller.handler()
  );
  router.get(
    "/usernames",
    setEndpointData("child", "usernames"),
    endpointData,
    confirmation,
    controller.handler()
  );
  router.get(
    "/usernames-and-ids",
    setEndpointData("child", "usernames-and-ids"),
    endpointData,
    confirmation,
    controller.handler()
  );

  return router;
}
