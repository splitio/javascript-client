export const splitDefinitions = {
  p1__split: {
    'name': 'p1__split',
    'status': 'ACTIVE',
    'conditions': []
  },
  p2__split: {
    'name': 'p2__split',
    'status': 'ACTIVE',
    'conditions': []
  },
  p3__split: {
    'name': 'p3__split',
    'status': 'ACTIVE',
    'conditions': []
  },
};

export const splitSerializedDefinitions = (function () {
  return Object.keys(splitDefinitions).reduce((acum, splitName) => {
    acum[splitName] = JSON.stringify(splitDefinitions[splitName]);
    return acum;
  }, {});
}());

export const segmentsDefinitions = {
  segment_1: {
    'name': 'segment_1',
    'added': ['nicolas@split.io'],
  },
};

export const segmentsSerializedDefinitions = (function () {
  return Object.keys(segmentsDefinitions).reduce((acum, segmentName) => {
    acum[segmentName] = JSON.stringify(segmentsDefinitions[segmentName]);
    return acum;
  }, {});
}());

export const preloadedDataWithSegments = {
  since: 1457552620999,
  splitsData: splitSerializedDefinitions,
  segmentsData: segmentsSerializedDefinitions
};
