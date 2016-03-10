const bucket = require('./utils').bucket;
const log = require('debug')('splitio-engine');

const engine = {
  /**
   * Get the treatment name given a key, a seed, and the percentage of each treatment.
   */
  getTreatment(key /*: string */, seed /*: number */, treatments /*: Treatments */) /*: string */ {
    const b = bucket(key, seed);
    const treatment = treatments.getTreatmentFor(b);

    log(`[engine] bucket ${b} for ${key} using seed ${seed} - treatment ${treatment}`);

    return treatment;
  }
};

module.exports = engine;
