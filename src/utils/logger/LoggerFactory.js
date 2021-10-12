/* eslint-disable no-console */
'use strict';

import objectAssign from 'object-assign';

export const LogLevels = {
  'DEBUG': 'DEBUG',
  'INFO': 'INFO',
  'WARN': 'WARN',
  'ERROR': 'ERROR',
  'NONE': 'NONE'
};

const LogLevelIndexes = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  NONE: 5
};

// DEBUG is the default. The log level is not specific to an SDK instance.
let GlobalLogLevel = LogLevelIndexes.DEBUG;

/**
 * @param {'DEBUG'|'INFO'|'WARN'|'ERROR'|'NONE'} level
 */
export const setLogLevel = (level) => {
  GlobalLogLevel = LogLevelIndexes[level];
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
    if (this._shouldLog(LogLevelIndexes.DEBUG))
      this._log(LogLevels.DEBUG, msg);
  }

  info(msg) {
    if (this._shouldLog(LogLevelIndexes.INFO))
      this._log(LogLevels.INFO, msg);
  }

  warn(msg) {
    if (this._shouldLog(LogLevelIndexes.WARN))
      this._log(LogLevels.WARN, msg);
  }

  error(msg) {
    if (this.options.displayAllErrors || this._shouldLog(LogLevelIndexes.ERROR))
      this._log(LogLevels.ERROR, msg);
  }

  _log(level, text) {
    const formattedText = this._generateLogMessage(level, text);

    console.log(formattedText);
  }

  _generateLogMessage(level, text) {
    const textPre = ' => ';
    let result = '';

    if (this.options.showLevel) {
      result += '[' + level + ']' + (level === LogLevels.INFO || level === LogLevels.WARN ? ' ' : '') + ' ';
    }

    if (this.category) {
      result += this.category + textPre;
    }

    return result += text;
  }

  /**
   * @param {number} level
   */
  _shouldLog(level) {
    return level >= GlobalLogLevel;
  }
}
