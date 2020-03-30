/**
 * Kill `splitName` at `splitStorage`, setting `defaultTreatment` and `changeNumber`,
 * only if the split exists and its `changeNumber` is older than the given one.
 * Used for SPLIT_KILL push notifications.
 */
export default function killLocally(splitStorage, splitName, defaultTreatment, changeNumber) {
  const split = splitStorage.getSplit(splitName);

  if (split) {
    const parsedSplit = JSON.parse(split);
    if (!parsedSplit.changeNumber || parsedSplit.changeNumber < changeNumber) {
      parsedSplit.killed = true;
      parsedSplit.defaultTreatment = defaultTreatment;
      parsedSplit.changeNumber = changeNumber;
      const newSplit = JSON.stringify(parsedSplit);
      splitStorage.addSplit(splitName, newSplit);
      // Instead of calling `splitStorage.addSplit`, we could optimize it at follows:
      //  for `InMemory` storage call:
      //    splitStorage.splitCache.set(splitName, newSplit);
      //  for `InLocalStorage` cache call:
      //    const splitKey = splitStorage.keys.buildSplitKey(splitName); localStorage.setItem(splitKey, split);
    }
  }
}