export interface Job {
  run(): void;
}

export interface PipeableJob {
  run<TType extends Object>(input: TType): TType;
}
