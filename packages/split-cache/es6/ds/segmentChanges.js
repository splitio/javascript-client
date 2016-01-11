'use strict';

// es6 promises support
require('native-promise-only');
// fetch API polyfill
require('isomorphic-fetch');

var segmentChangesDto = require('../dto/segmentChanges');

function segmentChangesDataSource({segmentName, authorizationKey}) {

  return fetch(`http://localhost:8081/api/segmentChanges/${segmentName}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorizationKey}`
    }
  })
  .then( resp => segmentChangesDto.parse( resp.json() ) );

}

module.exports = segmentChangesDataSource;
