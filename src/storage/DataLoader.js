import { isObject } from '../utils/lang';

// @TODO implement
export function validateData(serializedData) {
  return isObject(serializedData) ? true : false;
}

/**
 * Factory of data builders
 *
 * @param {Object} data validated serializedData and userId following the format proposed in https://github.com/godaddy/split-javascript-data-loader
 * and extended with a `mySegmentsData` property.
 */
export function dataLoaderFactory(serializedData = {}, userId) {

  /**
   * Storage-agnostic adaptation of `loadDataIntoLocalStorage` function
   * (https://github.com/godaddy/split-javascript-data-loader/blob/master/src/load-data.js)
   *
   * @param {Object} storage storage for client-side
   */
  return function loadData(storage) {
    // Do not load data if current serializedData is empty
    if (Object.keys(serializedData).length === 0) {
      return;
    }

    const { segmentsData = {}, since = 0, splitsData = {} } = serializedData;
    let { mySegmentsData } = serializedData;

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
    if (!mySegmentsData) {
      // segmentsData in an object where the property is the segment name and the pertaining value is a stringified object that contains the `added` array of userIds
      mySegmentsData = Object.keys(segmentsData).filter(segmentName => {
        const added = JSON.parse(segmentsData[segmentName]).added;
        return added.indexOf(userId) > -1;
      });
    }
    storage.segments.resetSegments(mySegmentsData);
  };

}