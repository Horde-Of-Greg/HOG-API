import { PipeableJob } from "../../../types/jobs";

export class Pipeline<TJob extends PipeableJob, TInput extends Object> {
  private jobs: Array<TJob> = [];

  public runAll(input: TInput) {
    let lastOutput: TInput = input;
    for (const job of this.jobs) {
      lastOutput = job.run(lastOutput);
    }
    return lastOutput;
  }

  public addOneJob(job: TJob) {
    this.jobs.push(job);
  }

  public addManyJobs(jobs: TJob[]) {
    this.jobs.concat(jobs);
  }
}
