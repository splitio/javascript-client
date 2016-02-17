'use strict';

function TimeDTOFactory(name /*: string */, collector /*: Collector */) /*: object */ {
  return {
    name,
    collector
  };
}

module.exports = TimeDTOFactory;
