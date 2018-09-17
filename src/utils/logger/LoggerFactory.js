/* eslint-disable no-console */
'use strict';

const format = require('util').format;

let isNode = typeof process !== 'undefined' && process.version ? true : false;

export const LogLevels = {
  'DEBUG': 'DEBUG',
  'INFO':  'INFO',
  'WARN':  'WARN',
  'ERROR': 'ERROR'
};

// Global log level ?
let GlobalLogLevel = LogLevels.DEBUG;

const defaultOptions = {
  showLevel: true
};

class Logger {
  constructor(category, options) {
    this.category = category;
    this.options = Object.assign({}, defaultOptions, options);
  }

  debug() {
    if(this._shouldLog(LogLevels.DEBUG))
      this._write(LogLevels.DEBUG, format.apply(null, arguments));
  }

  log() {
    if(this._shouldLog(LogLevels.DEBUG))
      this.debug.apply(this, arguments);
  }

  info() {
    if(this._shouldLog(LogLevels.INFO))
      this._write(LogLevels.INFO, format.apply(null, arguments));
  }

  warn() {
    if(this._shouldLog(LogLevels.WARN))
      this._write(LogLevels.WARN, format.apply(null, arguments));
  }

  error() {
    if(this._shouldLog(LogLevels.ERROR))
      this._write(LogLevels.ERROR, format.apply(null, arguments));
  }

  _write(level, text) {
    let formattedText = this._createLogMessage(level, text);
    const method = level === LogLevels.ERROR && !isNodejs ? 'error' : 'log';
    console[method](formattedText);
  }

  _createLogMessage(level, text) {
    const textFormat = ' => ';
    let result = '';

    if(this.options.showLevel) {
      result += '[' + level +']' + (level === LogLevels.INFO || level === LogLevels.WARN ? ' ' : '') + ' ';
    }

    result += this.category + textFormat + text;

    return result;
  }

  _shouldLog(level) {
    /* Read the log level from a globally available place ? */
    const logLevel = GlobalLogLevel;
    const levels   = Object.keys(LogLevels).map((f) => LogLevels[f]);
    const index    = levels.indexOf(level); // What's the index of what it's trying to check if it should log
    const levelIdx = levels.indexOf(logLevel); // What's the current log level index.
    return index >= levelIdx;
  }
}

export const setLogLevel = (level) => {
  GlobalLogLevel = level;
};

export const create = (category, options) => {
  return new Logger(category, options);
};
