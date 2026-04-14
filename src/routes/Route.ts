import { RoutePipeline } from "./../types/routes";
import { MiddlewareResolver } from "../middleware/Middleware";
import { ServiceResolver } from "../services/Service";
import { RouteAction } from "../types/routes";
import { Pipeline } from "../utils/structures/arraylike/Pipeline";
import { Queue } from "../utils/structures/arraylike/Queue";

export interface RouteResolver {
  resolve(routeQueue: Queue<Route>): RoutePipeline;
}

export class Route implements RouteResolver {
  protected pipeline: RoutePipeline = new Pipeline();

  constructor(
    public readonly action: RouteAction,
    private readonly middleware: MiddlewareResolver[],
  ) {
    this.buildPipeline();
  }

  private buildPipeline() {
    this.pipeline.addManyJobs(this.middleware);

    if (this.action.__brand === "service") {
      this.pipeline.addOneJob(this.action);
    }
  }

  resolve(routeQueue: Queue<Route>): RoutePipeline {
    const nextStep = routeQueue.dequeue();
    if (nextStep === undefined) {
      return this.pipeline;
    }

    return nextStep.resolve(routeQueue);
  }
}
