export class SCSError extends Error {
  constructor(message: string, public readonly input?: string) {
    super(message);
    this.name = "SCSError";
  }
}
