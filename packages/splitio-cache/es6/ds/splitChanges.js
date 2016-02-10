/* @flow */ 'use strict';

let log = require('debug')('splitio-cache:http');
let url = require('../url');
let splitMutatorFactory = require('../mutators/splitChanges');
let sinceValue = 0;

function splitChangesDataSource({authorizationKey}) {
  return fetch(url(`/splitChanges?since=${sinceValue}`), {
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

    log(`[${authorizationKey}] /splitChanges response using since=${sinceValue}`, json);

    sinceValue = till;

    return splitMutatorFactory( splits );
  })
  .catch(error => {
    log(`[${authorizationKey}] failure fetching splits using since [${sinceValue}] => [${error}]`);

    return error;
  });
}

module.exports = splitChangesDataSource;
