const base = require('../request');

module.exports = function GET({since}) {
  return base(`/splitChanges?since=${since}`);
};
