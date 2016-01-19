/* @flow */ 'use strict';

let Immutable = require('Immutable');

let segments = new Immutable.Map();

module.exports = {

  update(name /*: string */, segmentSet /*: Set */) /*: void */ {
    segments = segments.set(name, segmentSet);
  },

  get(name /*: string */) /*: Set */ {
    return segments.get(name);
  },

  toJS() /*: string */ {
    return segments.toJS();
  }

};
