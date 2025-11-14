import { PathLike } from "fs";

export type StandardError = {
  type: "error";
  code: number | null;
  status: boolean;
  send: boolean;
  message: string | null;
  location: PathLike | null;
  time: Date | null;
};
