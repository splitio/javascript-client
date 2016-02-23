'use strict';

var transport = undefined;

if (process.env.NODE_ENV !== 'production') {
  transport = require('../transport/logged');
} else {
  transport = require('../transport/basic');
}

module.exports = require('./service')(transport);
//# sourceMappingURL=index.js.map