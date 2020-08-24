import { DEFAULT_CACHE_EXPIRATION_IN_MILLIS } from './browser';

/**
 * Factory of data loaders
 *
 * @TODO update comment
 * @param {Object} preloadedData validated data following the format proposed in https://github.com/godaddy/split-javascript-data-loader
 * and extended with a `mySegmentsData` property.
 */
export function dataLoaderFactory(preloadedData = {}) {

  /**
   * Storage-agnostic adaptation of `loadDataIntoLocalStorage` function
   * (https://github.com/godaddy/split-javascript-data-loader/blob/master/src/load-data.js)
   *
   * @param {Object} storage storage for client-side
   * @param {Object} userId main user key defined at the SDK config
   */
  return function loadData(storage, userId) {
    // Do not load data if current preloadedData is empty
    if (Object.keys(preloadedData).length === 0) return;

    const { lastUpdated = -1, segmentsData = {}, since = -1, splitsData = {} } = preloadedData;

    const storedSince = storage.splits.getChangeNumber();
    const expirationTimestamp = Date.now() - DEFAULT_CACHE_EXPIRATION_IN_MILLIS;

    // Do not load data if current localStorage data is more recent,
    // or if its `lastUpdated` timestamp is older than the given `expirationTimestamp`,
    if (storedSince > since || lastUpdated < expirationTimestamp) return;

    // cleaning up the localStorage data, since some cached splits might need be part of the preloaded data
    storage.splits.flush();
    storage.splits.setChangeNumber(since);

    // splitsData in an object where the property is the split name and the pertaining value is a stringified json of its data
    Object.keys(splitsData).forEach(splitName => {
      storage.splits.addSplit(splitName, splitsData[splitName]);
    });

    // add mySegments data
    let mySegmentsData = preloadedData.mySegmentsData && preloadedData.mySegmentsData[userId];
    if (!mySegmentsData) {
      // segmentsData in an object where the property is the segment name and the pertaining value is a stringified object that contains the `added` array of userIds
      mySegmentsData = Object.keys(segmentsData).filter(segmentName => {
        const userIds = JSON.parse(segmentsData[segmentName]).added;
        return Array.isArray(userIds) && userIds.indexOf(userId) > -1;
      });
    }
    storage.segments.resetSegments(mySegmentsData);
  };

}