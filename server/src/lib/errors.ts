export class NotConfiguredError extends Error {
  constructor(what: string, hint: string) {
    super(`${what} is not configured. ${hint}`);
    this.name = 'NotConfiguredError';
  }
}
