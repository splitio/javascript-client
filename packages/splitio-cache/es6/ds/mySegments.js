/* @flow */ 'use strict';

const mySegmentsService = require('@splitsoftware/splitio-services/lib/mySegments');
const mySegmentsRequest = require('@splitsoftware/splitio-services/lib/mySegments/get');

const mySegmentMutationsFactory = require('../mutators/mySegments');

function mySegmentsDataSource() /*: Promise */ {
  return mySegmentsService(mySegmentsRequest())
    .then(resp => resp.json())
    .then(json => {
      return mySegmentMutationsFactory(
        json.mySegments.map(segment => segment.name)
      );
    })
    .catch(() => { /* noop */ });
}

module.exports = mySegmentsDataSource;
