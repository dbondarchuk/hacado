export class SmsTransientError extends Error {
  readonly retryable = true;

  constructor(message: string) {
    super(message);
    this.name = "SmsTransientError";
  }
}
