// @TODO extend Error directly once IE is depracated or when transport-runtime plugin supports the `exclude` config
// required to remove wrapNativeSuper Babel helper when targeting old environments like IE
const _Error = Error;

export class SplitError extends _Error {
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
