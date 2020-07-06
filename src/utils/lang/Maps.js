/**
 * Map implementation based on JS objects, with the minimal features used by the SDK.
 * Support string type as keys and any object as values
 */
export class ObjectMap {

  // unlike ES6 `Map`, it doesn't accept an iterable as first argument
  constructor() {
    this.clear();
  }

  clear() {
    this.items = {};
  }


  set(key, value) {
    this.items[key] = value;
    return this;
  }

  get(key) {
    return this.items[key];
  }

  has(key) {
    return this.items[key] !== undefined;
  }

  // unlike `Map.prototype.delete`, it doesn't return a boolean indicating if the item was deleted or not
  delete(key) {
    delete this.items[key];
  }

  keys() {
    return Object.keys(this.items);
  }

  /** Not used feature */
  // forEach(callback, thisArg) {
  //   return Object.keys(this.items).forEach(key => callback.call(thisArg, key, this.items[key]));
  // }

  get size() {
    return Object.keys(this.items).length;
  }

}

export function mapKeysToArray(map) {
  if (map instanceof ObjectMap) {
    return Object.keys(map.items);
  }
  return Array.from(map.keys());
}

export function mapValuesToArray(map) {
  if (map instanceof ObjectMap) {
    return Object.keys(map.items).map(key => map.items[key]);
  }
  // if not using ObjectMap as map, it means both Map and Array.from are supported
  return Array.from(map.values());
}

/**
 * return the Map constructor to use. If native Map is not available or it doesn't support the required features,
 * a ponyfill with minimal features is returned instead.
 */
function getMap() {
  if(!Array.from || !Map) { //} || new Map(['key', 'value']).size === 0) {
    return ObjectMap;
  }
  return Map;
}

export const _Map = getMap();