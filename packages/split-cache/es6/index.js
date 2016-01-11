'use strict';

require('native-promise-only');

var dataManager = require('./dm');
var dataSources = require('./ds');
var dsKeys = dataSources.keys;

dataManager.update(dsKeys.SEGMENT_CHANGES, {
  segmentName: 'demo',
  authorizationKey: 'eieulll8qhn4ervh3secsnko4t'
}).then(dto => console.log(JSON.stringify(dto, null, 2))).catch(error => console.log(error));

dataManager.update(dsKeys.SPLIT_CHANGES, {
  authorizationKey: 'eieulll8qhn4ervh3secsnko4t'
}).then(dto => console.log(JSON.stringify(dto, null, 2))).catch(error => console.log(error));
