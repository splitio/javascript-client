const base = require('../request');

module.exports = function GET({since, segmentName}) {
  return base(`/segmentChanges/${segmentName}?since=${since}`);
};
