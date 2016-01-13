'use strict';

// es6 promises support
require('native-promise-only');
// fetch API polyfill
require('isomorphic-fetch');

var log = require('debug')('split-cache:http');

var splitMutatorFactory = require('../mutators/splitChanges');
var cache = new Map();

function cacheKeyGenerator(authorizationKey) {
  return `${authorizationKey}/splitChanges`;
}

function splitChangesDataSource({authorizationKey}) {
  let cacheKey = cacheKeyGenerator(authorizationKey);
  let sinceValue = cache.get(cacheKey) || 0;

  return fetch(`http://localhost:8081/api/splitChanges?since=${sinceValue}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorizationKey}`
    }
  })
  .then(resp => resp.json())
  .then(json => {
    let {till, splits} = json;

    cache.set(cacheKey, till);

    return splitMutatorFactory( splits );
  })
  .catch(error => {
    log('[%s] failure fetching splits using since [%s] => [%s]', authorizationKey, sinceValue, error);

    return error;
  });
}

module.exports = splitChangesDataSource;
