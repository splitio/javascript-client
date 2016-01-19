/* @flow */ 'use strict';

/**
@TODO

2- URLs should be handled in another way, probably reading a configuration file
   so clients could build / configure servers deployments.
3- DataSources could be abstracted because for now, both implementations are the
   same.
4- LOG should be only present while we use development mode.

**/

require('babel-polyfill');
require('isomorphic-fetch');

let log = require('debug')('splitio-cache:http');

let segmentMutatorFactory = require('../mutators/segmentChanges');
let cache = new Map();

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
    log(`[${authorizationKey}] failure fetching segment [${segmentName}] using since [${sinceValue}] => [${error}]`);

    return error;
  });
}

module.exports = segmentChangesDataSource;
