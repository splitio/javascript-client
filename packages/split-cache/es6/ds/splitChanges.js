'use strict';

// es6 promises support
require('native-promise-only');
// fetch API polyfill
require('isomorphic-fetch');

var splitChangesDto = require('../dto/splitChanges');

function splitChangesDataSource({authorizationKey}) {

  return fetch('http://localhost:8081/api/splitChanges', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authorizationKey}`
    }
  })
  .then( resp => splitChangesDto.parse( resp.json() ) );

}

module.exports = splitChangesDataSource;
