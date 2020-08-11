import { isObject } from '../utils/lang';

// @TODO implement
export function validateData(serializedData) {
  return isObject(serializedData) ? true : false;
}

/**
 * Factory of data builders
 *
 * @param {Object} serializedData validated data following the format proposed in https://github.com/godaddy/split-javascript-data-loader
 * and extended with a `mySegmentsData` property.
 */
export function dataLoaderFactory(serializedData = {}) {

  /**
   * Storage-agnostic adaptation of `loadDataIntoLocalStorage` function
   * (https://github.com/godaddy/split-javascript-data-loader/blob/master/src/load-data.js)
   *
   * @param {Object} storage storage for client-side
   * @param {Object} userId main user key defined at the SDK config
   */
  return function loadData(storage, userId) {
    // Do not load data if current serializedData is empty
    if (Object.keys(serializedData).length === 0) {
      return;
    }

    const { segmentsData = {}, since = 0, splitsData = {} } = serializedData;

    const currentSince = storage.splits.getChangeNumber();

    // Do not load data if current localStorage data is more recent
    if (since <= currentSince) {
      return;
    }
    // Split.IO recommends cleaning up the localStorage data
    if (currentSince === -1) storage.splits.flush();
    storage.splits.setChangeNumber(since);

    // splitsData in an object where the property is the split name and the pertaining value is a stringified json of its data
    Object.keys(splitsData).forEach(splitName => {
      storage.splits.addSplit(splitName, splitsData[splitName]);
    });

    // add mySegments data
    let userIdMySegmentsData = serializedData.mySegmentsData && serializedData.mySegmentsData[userId];
    if (!userIdMySegmentsData) {
      // segmentsData in an object where the property is the segment name and the pertaining value is a stringified object that contains the `added` array of userIds
      userIdMySegmentsData = Object.keys(segmentsData).filter(segmentName => {
        const added = JSON.parse(segmentsData[segmentName]).added;
        return added.indexOf(userId) > -1;
      });
    }
    storage.segments.resetSegments(userIdMySegmentsData);
  };

}