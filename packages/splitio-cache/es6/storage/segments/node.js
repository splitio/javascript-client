/* @flow */ 'use strict';

let Immutable = require('Immutable');

let segments = new Immutable.Map();

let log = require('debug')('splitio-cache:segments');

module.exports = {

  update(name /*: string */, segmentSet /*: Set */) /*: void */ {
    log(`Updating segment ${name} with ${segmentSet}`);

    segments = segments.set(name, segmentSet);
  },

  get(name /*: string */) /*: Set */ {
    return segments.get(name);
  },

  toJS() /*: string */ {
    return segments.toJS();
  }

};
