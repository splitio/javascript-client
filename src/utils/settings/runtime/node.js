// @flow

'use strict';

const os = require('os');
const ip = require('ip');

exports.ip = ip.address();
exports.hostname = os.hostname();
