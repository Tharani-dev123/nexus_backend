export class AppError extends Error {
  status: number;
  serverLoggingOptions: object;
  data: object;

  constructor(
    message: string,
    status: number,
    serverLoggingOptions: object = {},
    data: object = {}
  ) {
    super(message);
    this.status = status;
    (this.serverLoggingOptions = serverLoggingOptions), (this.data = data);

    // Fix prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
