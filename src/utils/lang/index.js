/**
 * Checks if the target string starts with the sub string.
 */
export function startsWith(target, sub) {
  if (!(isString(target) && isString(sub))) {
    return false;
  }
  return target.slice(0, sub.length) === sub;
}

/**
 * Checks if the target string ends with the sub string.
 */
export function endsWith(target, sub) {
  if (!(isString(target) && isString(sub))) {
    return false;
  }
  return target.slice(target.length - sub.length) === sub;
}

/**
 * Safely retrieve the specified prop from obj. If we can't retrieve
 * that property value, we return the default value.
 */
export function get(obj, prop, val) {
  let res = val;

  try { // No risks nor lots of checks.
    const pathPieces = prop.split('.');
    let partial = obj;
    pathPieces.forEach(pathPiece => partial = partial[pathPiece]);

    if (typeof partial !== 'undefined') res = partial;
  } catch (e) {
    // noop
  }
  return res;
}

/**
 * Evaluates iteratee for each element of the source array. Returns the index of the first element
 * for which iteratee returns truthy. If no element is found or there's an issue with the params it returns -1.
 */
export function findIndex(source, iteratee) {
  if (Array.isArray(source) && typeof iteratee === 'function') {
    return source.findIndex(iteratee);
  }

  return -1;
}

/**
 * Loops through a source collection (an object or an array) running iteratee
 * against each element. It returns the first element for which iteratee returned
 * a truthy value and stops the loop.
 * Iteratee receives three arguments (element, key/index, collection)
 */
export function find(source, iteratee) {
  let res;

  if (isObject(source)) {
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length && !res; i++) {
      const key = keys[i];
      const iterateeResult = iteratee(source[key], key, source);

      if (iterateeResult) res = source[key];
    }
  } else if (Array.isArray(source)) {
    for (let i = 0; i < source.length && !res; i++) {
      const iterateeResult = iteratee(source[i], i, source);

      if (iterateeResult) res = source[i];
    }
  }

  return res;
}

/**
 * Checks if a given value is a string.
 */
export function isString(val) {
  return typeof val === 'string' || val instanceof String;
}

/**
 * Checks if a given value is a finite number.
 */
export function isFinite(val) {
  if (typeof val === 'number') return Number.isFinite(val);
  if (val instanceof Number) return Number.isFinite(val.valueOf());

  return false;
}

let uniqueIdCounter = -1;

/**
 * Returns a number to be used as ID, which will be unique.
 */
export function uniqueId() {
  return uniqueIdCounter++;
}

export function isObject(obj) {
  return obj && typeof obj === 'object' && obj.constructor === Object;
}

/**
 * There are some assumptions here. It's for internal use and we don't need verbose errors
 * or to ensure the data types or whatever. Parameters should always be correct (at least have a target and a source, of type object).
 */
export function merge(target, source, ...rest) {
  let res = target;

  isObject(source) && Object.keys(source).forEach(key => {
    let val = source[key];

    if (isObject(val) && res[key] && isObject(res[key])) {
      val = merge({}, res[key], val);
    }

    if (val !== undefined) {
      res[key] = val;
    }
  });

  if (rest && rest.length) {
    const nextSource = rest.splice(0, 1)[0];
    res = merge(res, nextSource, ...rest);
  }

  return res;
}

/**
 * Removes duplicate items on an array of strings.
 */
export function uniq(arr) {
  const seen = {};
  return Array.filter(arr, function(item) {
    return seen.hasOwnProperty(item) ? false : seen[item] = true;
  });
}

export function toString(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(val => isString(val) ? val : '') + '';

  let result = val + '';
  return (result === '0' && (1 / val) === Number.NEGATIVE_INFINITY) ? '-0' : result;
}

export function toNumber(val) {
  if (typeof val === 'number') return val;

  if (isObject(val) && typeof val.valueOf === 'function') {
    let valOf = val.valueOf();
    val = isObject(valOf) ? valOf + '' : valOf;
  }

  if (typeof val !== 'string') {
    return val === 0 ? val : +val;
  }
  // Remove trailing whitespaces.
  val = val.replace(/^\s+|\s+$/g, '');

  return +val;
}

export function forOwn(obj, iteratee) {
  const keys = Object.keys(obj);

  keys.forEach(key => iteratee(obj[key], key, obj));

  return obj;
}

export function groupBy(source, prop) {
  const map = {};

  if (Array.isArray(source) && isString(prop)) {
    for(let i = 0; i < source.length; i++) {
      const key = source[i][prop];

      // Skip the element if the key is not a string.
      if (isString(key)) {
        if (!map[key]) map[key] = [];

        map[key].push(source[i]);
      }
    }
  }

  return map;
}
