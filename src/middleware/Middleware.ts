import { PipeableJob } from "../types/jobs";

export interface MiddlewareResolver extends PipeableJob {}

export abstract class Middleware implements MiddlewareResolver {
  public abstract run<Request>(input: Request): Request;
}
