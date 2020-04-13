import thenable from '../../utils/promise/thenable';

/**
 * Kill `splitName` at `this` split storage, setting `defaultTreatment` and `changeNumber`,
 * only if the split exists and its `changeNumber` is older than the given one.
 * Used for SPLIT_KILL push notifications.
 *
 * @param {string} splitName
 * @param {string} defaultTreatment
 * @param {number} changeNumber
 * @returns {Promise}
 */
export default function killLocally(splitName, defaultTreatment, changeNumber) {
  const split = this.getSplit(splitName);
  const splitPromise = thenable(split) ? split : Promise.resolve(split);

  return splitPromise.then((split) => {
    if (split) {
      const parsedSplit = JSON.parse(split);
      if (!parsedSplit.changeNumber || parsedSplit.changeNumber < changeNumber) {
        parsedSplit.killed = true;
        parsedSplit.defaultTreatment = defaultTreatment;
        parsedSplit.changeNumber = changeNumber;
        const newSplit = JSON.stringify(parsedSplit);

        return this.addSplit(splitName, newSplit);
      }
    }
  });
}