import { Router } from "express";
import { setEndpointData } from "../../middleware/setEndpointData";
import { oredicRoutes } from "./oredic/oredic-ae2";

export function utilRoutes() {
  const router = Router();

  router.use(
    "/oredic-ae2",
    setEndpointData("main", "oredic-ae2"),
    oredicRoutes()
  );

  return router;
}
