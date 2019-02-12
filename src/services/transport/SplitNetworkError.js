export default class SplitNetworkError extends Error {
  constructor(msg, code) {
    super(msg);
    this.statusCode = code;
  }
}
