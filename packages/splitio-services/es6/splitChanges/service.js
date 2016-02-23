'use strict';

function MySegmentsContext(Transport) {
  return function MySegmentsFetch(request) {
    return Transport(request);
  };
}

module.exports = MySegmentsContext;
