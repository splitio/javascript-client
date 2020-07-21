/**
 * Map implementation based on es6-map polyfill (https://github.com/medikoo/es6-map/blob/master/polyfill.js),
 * with the minimal features used by the SDK.
 */
export class MapPoly {

  // unlike ES6 `Map`, it doesn't accept an iterable as first argument
  constructor() {
    this.__mapKeysData__ = [];
    this.__mapValuesData__ = [];
  }

  set(key, value) {
    var index = this.__mapKeysData__.indexOf(key);
    if (index === -1) {
      index = this.__mapKeysData__.push(key) - 1;
    }
    this.__mapValuesData__[index] = value;
    return this;
  }

  get(key) {
    var index = this.__mapKeysData__.indexOf(key);
    if (index === -1) return;
    return this.__mapValuesData__[index];
  }

  has(key) {
    return this.__mapKeysData__.indexOf(key) !== -1;
  }

  delete(key) {
    var index = this.__mapKeysData__.indexOf(key);
    if (index === -1) return false;
    this.__mapKeysData__.splice(index, 1);
    this.__mapValuesData__.splice(index, 1);
    return true;
  }

  get size() {
    return this.__mapKeysData__.length;
  }

}

export function mapKeysToArray(map) {
  if (map instanceof MapPoly) {
    return map.__mapKeysData__.slice();
  }
  // if not using MapPoly as map, it means both Map.prototype.keys and Array.from are supported
  return Array.from(map.keys());
}

export function mapValuesToArray(map) {
  if (map instanceof MapPoly) {
    return map.__mapValuesData__.slice();
  }
  // if not using MapPoly as map, it means both Map.prototype.values and Array.from are supported
  return Array.from(map.values());
}

/**
 * return the Map constructor to use. If `Array.from` built-in or native Map is not available or it doesn't support the required features,
 * a ponyfill with minimal features is returned instead.
 */
function getMapConstructor() {
  if (!Array.from || !Map || !Map.prototype.values || !Map.prototype.keys) {
    return MapPoly;
  }
  return Map;
}

export const _Map = getMapConstructor();