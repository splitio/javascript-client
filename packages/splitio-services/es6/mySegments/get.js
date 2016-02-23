'use strict';

const settings = require('@splitsoftware/splitio-utils/lib/settings');
const base = require('../request');

module.exports = function GET() {
  let key = settings.get('key');

  return base(`/mySegments/${key}`);
};
