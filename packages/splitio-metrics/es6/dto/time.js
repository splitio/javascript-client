'use strict';

function TimeDTOFactory(name /*: string */, latencies /*: Collector */) /*: object */ {
  return {
    name,
    latencies
  };
}

module.exports = TimeDTOFactory;
