'use strict';

module.exports = {
  enum: {
    ON: Symbol(),
    OFF: Symbol()
  },

  type(descriptor) {
    switch (descriptor) {
      case 'on':
        return this.enum.ON;
      case 'off':
      case 'control':
        return this.enum.OFF;
      default:
        throw new Error('Invalid partition descriptor provided.');
    }
  }
};
