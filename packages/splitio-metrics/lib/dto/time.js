'use strict';

function TimeDTOFactory(name /*: string */, collector /*: Collector */) /*: object */{
  return {
    toJSON: function toJSON() {
      return {
        name: name,
        collector: collector
      };
    }
  };
}

module.exports = TimeDTOFactory;
//# sourceMappingURL=time.js.map