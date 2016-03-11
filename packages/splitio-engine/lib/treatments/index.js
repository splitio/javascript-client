'use strict';

/*::
  type PartitionDTO = {
    treatment: string,
    size: number
  }
*/

//
// [1] Transpilation process is not doing a good job infering which "polyfills"
// are required at runtime, so we end doing this kind of lodash style expressions
// using core-js.
//
var findIndex = require('core-js/library/fn/array/find-index');

function Treatments(ranges /*: array<number> */, treatments /*: array<string> */) {
  if (!(this instanceof Treatments)) {
    return new Treatments(ranges, treatments);
  }

  if (ranges[ranges.length - 1] !== 100) throw new RangeError('Provided invalid dataset as input');

  this._ranges = ranges;
  this._treatments = treatments;
}

Treatments.parse = function parse(data /*: array<PartitionDTO> */) /*: Treatments */{
  var _data$reduce = data.reduce(function (accum, value) {
    var size = value.size;
    var treatment = value.treatment;


    accum.ranges.push(accum.inc += size);
    accum.treatments.push(treatment);

    return accum;
  }, {
    inc: 0,
    ranges: [],
    treatments: []
  });

  var ranges = _data$reduce.ranges;
  var treatments = _data$reduce.treatments;


  return new Treatments(ranges, treatments);
};

Treatments.prototype.getTreatmentFor = function getTreatmentFor(x /*: number */) /*: string */{
  if (x < 0 || x > 100) throw new RangeError('Please provide a value between 0 and 100');

  // Readme [1]
  // We need to manually add any dependency which escape of dummy resolution
  // I'll deal with this in a future release
  // for (let [k, r] of this._ranges.entries()) {
  //   if (x <= r) return this._treatments[k];
  // }

  var index = findIndex(this._ranges, function (range) {
    return x <= range;
  });
  var treatment = this._treatments[index];

  return treatment;
};

module.exports = Treatments;
//# sourceMappingURL=index.js.map