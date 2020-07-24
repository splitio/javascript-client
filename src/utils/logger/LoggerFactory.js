/* eslint-disable no-console */
'use strict';

import objectAssign from 'object-assign';

export const LogLevels = {
  'DEBUG': 'DEBUG',
  'INFO':  'INFO',
  'WARN':  'WARN',
  'ERROR': 'ERROR',
  'NONE': 'NONE'
};

// DEBUG is the default. The log level is not specific to an SDK instance.
let GlobalLogLevel = LogLevels.DEBUG;

export const setLogLevel = (level) => {
  GlobalLogLevel = level;
};

const defaultOptions = {
  showLevel: true,
  displayAllErrors: false
};

export class Logger {
  constructor(category, options) {
    this.category = category;
    this.options = objectAssign({}, defaultOptions, options);
  }

  debug(msg) {
    if(this._shouldLog(LogLevels.DEBUG))
      this._log(LogLevels.DEBUG, msg);
  }

  info(msg) {
    if(this._shouldLog(LogLevels.INFO))
      this._log(LogLevels.INFO, msg);
  }

  warn(msg) {
    if(this._shouldLog(LogLevels.WARN))
      this._log(LogLevels.WARN, msg);
  }

  error(msg) {
    if(this.options.displayAllErrors || this._shouldLog(LogLevels.ERROR))
      this._log(LogLevels.ERROR, msg);
  }

  _log(level, text) {
    const formattedText = this._generateLogMessage(level, text);

    console.log(formattedText);
  }

  _generateLogMessage(level, text) {
    const textPre = ' => ';
    let result = '';

    if(this.options.showLevel) {
      result += '[' + level +']' + (level === LogLevels.INFO || level === LogLevels.WARN ? ' ' : '') + ' ';
    }

    if (this.category) {
      result += this.category + textPre;
    }

    return result += text;
  }

  _shouldLog(level) {
    const logLevel = GlobalLogLevel;
    const levels = Object.keys(LogLevels).map(f => LogLevels[f]);
    const index = levels.indexOf(level); // What's the index of what it's trying to check if it should log
    const levelIdx = levels.indexOf(logLevel); // What's the current log level index.

    return index >= levelIdx;
  }
}
