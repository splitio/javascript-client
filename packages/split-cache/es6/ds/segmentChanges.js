'use strict';

// es6 promises support
require('native-promise-only');
// fetch API polyfill
require('isomorphic-fetch');

var log = require('debug')('split-cache:http');

var segmentMutatorFactory = require('../mutators/segmentChanges');
var cache = new Map();

function cacheKeyGenerator(authorizationKey, segmentName) {
  return `${authorizationKey}/segmentChanges/${segmentName}`;
}

function segmentChangesDataSource({authorizationKey, segmentName}) {
  let cacheKey = cacheKeyGenerator(authorizationKey, segmentName);
  let sinceValue = cache.get(cacheKey) || 0;

  return fetch(`http://localhost:8081/api/segmentChanges/${segmentName}?since=${sinceValue}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorizationKey}`
    }
  })
  .then(resp => resp.json())
  .then(json => {
    let {since, till, ...data} = json;

    cache.set(cacheKey, till);

    return segmentMutatorFactory( data );
  })
  .catch(error => {
    log('[%s] failure fetching segment [%s] using since [%s] => [%s]', authorizationKey, segmentName, sinceValue, error);

    return error;
  });
}

module.exports = segmentChangesDataSource;
