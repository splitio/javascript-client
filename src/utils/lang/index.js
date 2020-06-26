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
export function endsWith(target, sub, caseInsensitive = false) {
  if (!(isString(target) && isString(sub))) {
    return false;
  }
  if (caseInsensitive) {
    target = target.toLowerCase();
    sub = sub.toLowerCase();
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
    for (let i = 0; i < source.length; i++) {
      if (iteratee(source[i], i, source) === true) {
        return i;
      }
    }
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
 * https://tc39.es/ecma262/#sec-isfinite-number
 * Uses `Number.isFinite` if available, or fallback to global `isFinite`
 */
export function numberIsFinite(val) {
  if(Number.isFinite) {
    if (typeof val === 'number') return Number.isFinite(val);
    if (val instanceof Number) return Number.isFinite(val.valueOf());
    return false;
  } else {
    return isFinite(val); // global `isFinite` function. Unlike Number.isFinite, it converts the value to a Number.
  }
}

/**
 * `Number.isNaN` method. Checks if a given value is a NaN.
 * https://tc39.github.io/ecma262/#sec-number.isnan
 * Implementation of `core-js-pure/modules/es.number.is-nan.js`
 */
export function numberIsNaN(number) {
  // eslint-disable-next-line eqeqeq
  return number != number;
}

/**
 * `Number.isInteger` method.
 * https://tc39.github.io/ecma262/#sec-number.isinteger
 * Implementation of `core-js-pure/internals/is-integer.js`
 */
export function numberIsInteger(val) {
  return !isObject(val) && isFinite(val) && Math.floor(val) === val;
}

let uniqueIdCounter = -1;

/**
 * Returns a number to be used as ID, which will be unique.
 */
export function uniqueId() {
  return uniqueIdCounter++;
}

/**
 * Validates if a value is an object.
 */
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

    if (isObject(val)) {
      if (res[key] && isObject(res[key])) { // If both are objects, merge into a new one.
        val = merge({}, res[key], val);
      } else { // else make a copy.
        val = merge({}, val);
      }
    }
    // We skip undefined values.
    if (val !== undefined) res[key] = val;
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
  return arr.filter(function(item) {
    return Object.prototype.hasOwnProperty.call(seen, item) ? false : seen[item] = true;
  });
}

/**
 * Removes duplicate items on an array of objects using an optional `stringify` function as equality criteria.
 * It uses JSON.stringify as default criteria.
 */
export function unicAsStrings(arr, stringify = JSON.stringify) {
  const seen = {};
  return arr.filter(function(item) {
    const itemString = stringify(item);
    return Object.prototype.hasOwnProperty.call(seen, itemString) ? false : seen[itemString] = true;
  });
}

/**
 * Transforms a value into it's string representation.
 */
export function toString(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(val => isString(val) ? val : '') + '';

  let result = val + '';
  return (result === '0' && (1 / val) === Number.NEGATIVE_INFINITY) ? '-0' : result;
}

/**
 * Transforms a value into a number.
 * Note: We're not expecting anything fancy here. If we are at some point, add more type checks.
 */
export function toNumber(val) {
  if (typeof val === 'number') return val;

  if (isObject(val) && typeof val.valueOf === 'function') {
    const valOf = val.valueOf();
    val = isObject(valOf) ? valOf + '' : valOf;
  }

  if (typeof val !== 'string') {
    return val === 0 ? val : +val;
  }

  // Remove trailing whitespaces.
  val = val.replace(/^\s+|\s+$/g, '');

  return +val;
}

/**
 * Executes iteratee for given obj own props.
 */
export function forOwn(obj, iteratee) {
  const keys = Object.keys(obj);

  keys.forEach(key => iteratee(obj[key], key, obj));

  return obj;
}

/**
 * Parses an array into a map of different arrays, grouping by the specified prop value.
 */
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

/**
 * Returns the name of a given function.
 */
export function getFnName(fn) {
  if (fn.name) return fn.name;

  return (fn.toString().match(/function (.+?)\(/)||['',''])[1];
}

/**
 * Shallow clone an object
 */
export function shallowClone(obj) {
  const keys = Object.keys(obj);
  const output = {};

  for (let i = 0; i < keys.length; i++) {
    output[keys[i]] = obj[keys[i]];
  }

  return output;
}

export function isBoolean(val) {
  return val === true || val === false;
}

/** Array utils */
export function addToArray(array, item) {
  const index = array.indexOf(item);
  if (index > -1) {
    array[index] = item;
  } else {
    array.push(item);
  }
}

export function deleteFromArray(array, item) {
  const index = array.indexOf(item);
  if (index > -1) {
    array.splice(index, 1);
  }
}