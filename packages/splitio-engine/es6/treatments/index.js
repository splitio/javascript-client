/* @flow */ 'use strict';

/*::
  type PartitionDTO = {
    treatment: string,
    size: number
  }
*/

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

  for (let [k, r] of this._ranges.entries()) {
    if (x <= r) return this._treatments[k];
  }
}

module.exports = Treatments;
