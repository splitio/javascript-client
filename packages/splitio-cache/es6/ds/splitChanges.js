
import type {
  Thenable
} from '../types';

const splitChangesService = require('@splitsoftware/splitio-services/lib/splitChanges');
const splitChangesRequest = require('@splitsoftware/splitio-services/lib/splitChanges/get');

const splitMutatorFactory = require('../mutators/splitChanges');

let since = -1;

function splitChangesDataSource() :Thenable {
  return splitChangesService(splitChangesRequest({
    since
  }))
  .then(resp => resp.json())
  .then(json => {
    let {till, splits} = json;

    since = till;

    return splitMutatorFactory( splits );
  })
  .catch(() => { /* noop */ });
}

module.exports = splitChangesDataSource;
