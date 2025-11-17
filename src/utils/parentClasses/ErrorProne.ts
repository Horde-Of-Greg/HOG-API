import { StandardError } from "../../types/errors";

export class ErrorProne {
  error: StandardError;

  constructor() {
    this.error = {
      type: "error",
      code: null,
      status: false,
      send: false,
      message: null,
      location: __dirname,
      time: null,
    };
  }

  protected setError(code: number, message: string): StandardError {
    this.error.code = code;
    this.error.status = true;
    this.error.send = true;
    this.error.message = message;
    this.error.time = new Date();

    return this.error;
  }

  protected setWarn(message: string): StandardError {
    this.error.code = 200;
    this.error.status = true;
    this.error.send = true;
    this.error.message = message;
    this.error.time = new Date();

    return this.error;
  }
}
