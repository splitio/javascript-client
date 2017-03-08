'use strict';

function mode(key, mode) {
  if (key === 'localhost') return 'localhost';

  if (['standalone', 'producer', 'consumer'].indexOf(mode) === -1) throw 'Invalid mode provided';

  return mode;
}

module.exports = mode;
