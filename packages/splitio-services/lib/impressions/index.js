'use strict';

var transport = void 0;

if (process.env.NODE_ENV !== 'production') {
  transport = require('../transport/logged');
} else {
  transport = require('../transport/basic');
}

module.exports = require('../transport/service')(transport);
//# sourceMappingURL=index.js.map