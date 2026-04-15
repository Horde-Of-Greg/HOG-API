import { PipeableJob } from "../types/jobs";

export interface ServiceResolver extends PipeableJob {}

export abstract class Service implements ServiceResolver {
  public abstract run<Request>(input: Request): Request;
}
