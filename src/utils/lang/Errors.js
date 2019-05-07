export class SplitError extends Error {
  constructor(msg = 'Split Error') {
    super(msg);
    this.message = msg;
  }
}

export class SplitTimeoutError extends SplitError {
  constructor(msg) {
    super(msg || 'Split Timeout Error');
  }
}

export class SplitNetworkError extends SplitError {
  constructor(msg, code) {
    super(msg || 'Split Network Error');
    this.statusCode = code;
  }
}
