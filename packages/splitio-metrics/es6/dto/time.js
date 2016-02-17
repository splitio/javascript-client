'use strict';

function TimeDTOFactory(name /*: string */, collector /*: Collector */) /*: object */ {
  return {
    toJSON() {
      return {
        name,
        collector
      };
    }
  };
}

module.exports = TimeDTOFactory;
