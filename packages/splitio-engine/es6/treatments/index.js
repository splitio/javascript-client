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
const findIndex = require('core-js/library/fn/array/find-index');

function Treatments(ranges /*: array<number> */, treatments /*: array<string> */) {
  if (!(this instanceof Treatments)) {
     return new Treatments(baseInfo, evaluator, segments);
  }

  if (ranges[ranges.length - 1] !== 100) throw new RangeError('Provided invalid dataset as input');

  this._ranges = ranges;
  this._treatments = treatments;
}

Treatments.parse = function parse(data /*: array<PartitionDTO> */) /*: Treatments */ {
  let {ranges, treatments} = data.reduce((accum, value) => {
    let {size, treatment} = value;

    accum.ranges.push( accum.inc += size );
    accum.treatments.push( treatment );

    return accum;
  }, {
    inc: 0,
    ranges: [],
    treatments: []
  });

  return new Treatments(ranges, treatments);
}

Treatments.prototype.getTreatmentFor = function getTreatmentFor(x /*: number */) /*: string */ {
  if (x < 0 || x > 100) throw new RangeError('Please provide a value between 0 and 100');

  // Readme [1]
  // We need to manually add any dependency which escape of dummy resolution
  // I'll deal with this in a future release
  // for (let [k, r] of this._ranges.entries()) {
  //   if (x <= r) return this._treatments[k];
  // }

  const index = findIndex(this._ranges, range => x <= range);
  const treatment = this._treatments[index];

  return treatment;
}

module.exports = Treatments;
