'use strict';

let transport;

if (process.env.NODE_ENV !== 'production') {
  transport = require('../transport/logged');
} else {
  transport = require('../transport/basic');
}

module.exports = require('./service')(transport);
