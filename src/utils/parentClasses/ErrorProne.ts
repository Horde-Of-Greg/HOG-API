import { StandardError } from "../../types/errors";

export class ErrorProne {
  protected error: StandardError;
  protected className: string;

  constructor(className?: string) {
    this.className = className || this.constructor.name;
    this.error = {
      type: "error",
      code: null,
      status: false,
      send: false,
      message: null,
      location: __dirname,
      time: null,
      context: null,
      stackTrace: [],
    };
  }

  protected sendErrorToClient() {
    return {
      message: this.error.message ? this.error.message : "no message",
      culprit: `Error in file: ${this.error.location}, from method: ${this.error.context ? this.error.context : "Uknown"}`,
      time: this.error.time ? this.error.time : "Uknown",
      stackTrace: this.error.stackTrace,
    };
  }

  protected setError(
    code: number,
    message: string,
    methodName?: string
  ): StandardError {
    this.error.code = code;
    this.error.status = true;
    this.error.send = true;
    this.error.message = message;
    this.error.time = new Date();
    this.error.context = methodName
      ? `${this.className}.${methodName}`
      : this.className;
    this.error.stackTrace = [];

    return this.error;
  }

  protected setWarn(message: string, methodName?: string): StandardError {
    this.error.code = 200;
    this.error.status = true;
    this.error.send = true;
    this.error.message = message;
    this.error.time = new Date();
    this.error.context = methodName
      ? `${this.className}.${methodName}`
      : this.className;
    this.error.stackTrace = [];

    return this.error;
  }

  protected propagateError(
    childError: StandardError,
    message: string,
    methodName?: string
  ): StandardError {
    const context = methodName
      ? `${this.className}.${methodName}`
      : this.className;

    return {
      type: "error",
      code: childError.code,
      status: true,
      send: true,
      message: message,
      location: __dirname,
      time: new Date(),
      context: context,
      stackTrace: [childError, ...(childError.stackTrace || [])],
    };
  }

  protected getErrorCode() {
    const errorCode = this.error.code;
    if (!errorCode) {
      this.propagateError(
        this.error,
        "Could not even get error code... somehow? Defaulting to 500. If you see this, the API is fucked."
      );
      return 500;
    }
    return errorCode;
  }

  protected isError(value: any): value is StandardError {
    return value && typeof value === "object" && value.type === "error";
  }
}
