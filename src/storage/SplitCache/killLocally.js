/**
 * Kill `splitName` at `splitStorage`, setting `defaultTreatment` and `changeNumber`.
 * Used for SPLIT_KILL push notifications.
 */
export default function killLocally(splitStorage, splitName, defaultTreatment, changeNumber) {
  const split = splitStorage.getSplit(splitName);

  if (split) {
    const parsedSplit = JSON.parse(split);
    parsedSplit.killed = true;
    parsedSplit.defaultTreatment = defaultTreatment;
    const newSplit = JSON.stringify(parsedSplit);
    splitStorage.addSplit(splitName, newSplit);
    // Instead of calling `splitStorage.addSplit`, we could optimize it at follows:
    //  for `InMemory` storage call:
    //    splitStorage.splitCache.set(splitName, newSplit);
    //  for `InLocalStorage` cache call:
    //    const splitKey = splitStorage.keys.buildSplitKey(splitName); localStorage.setItem(splitKey, split);
    splitStorage.setChangeNumber(changeNumber);
  }
}