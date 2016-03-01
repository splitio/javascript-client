const segmentChangesService = require('@splitsoftware/splitio-services/lib/segmentChanges');
const segmentChangesRequest = require('@splitsoftware/splitio-services/lib/segmentChanges/get');

const segmentMutatorFactory = require('../mutators/segmentChanges');
const cache = new Map();

function cacheKeyGenerator(authorizationKey, segmentName) {
  return `${authorizationKey}/segmentChanges/${segmentName}`;
}

function segmentChangesDataSource({
  authorizationKey,
  segmentName
}) :Promise {
  const cacheKey = cacheKeyGenerator(authorizationKey, segmentName);
  const since = cache.get(cacheKey) || -1;

  return segmentChangesService(segmentChangesRequest({
    since,
    segmentName
  }))
  .then(resp => resp.json())
  .then(json => {
    let {since, till, ...data} = json;

    cache.set(cacheKey, till);

    return segmentMutatorFactory( data );
  })
  .catch(() => { /* noop */ });
}

module.exports = segmentChangesDataSource;
