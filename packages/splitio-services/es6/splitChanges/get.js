'use strict';

const settings = require('@splitsoftware/splitio-utils/lib/settings');
const base = require('../request');

module.exports = function GET({since}) {
  return base(`/splitChanges?since=${since}`);
};
