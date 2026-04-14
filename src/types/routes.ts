import { MiddlewareResolver } from "../middleware/Middleware";
import { RouteResolver } from "../routes/Route";
import { ServiceResolver } from "../services/Service";
import { Pipeline } from "../utils/structures/arraylike/Pipeline";

export type RouteChildren = Record<string, RouteResolver>;
export type RouteAction =
  | (RouteChildren & { readonly __brand: "children" })
  | (ServiceResolver & { readonly __brand: "service" });

export type RoutePipeline = Pipeline<
  MiddlewareResolver | ServiceResolver,
  Request
>;
