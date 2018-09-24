export function startsWith(target, sub) {
  return target.slice(0, sub.length) === sub;
}

export function endsWith(target, sub) {
  return target.slice(target.length - sub.length) === sub;
}

export function get(obj, prop, val) {
  let res = val;

  try {
    const pathPieces = prop.split('.');
    let partial = obj;
    pathPieces.forEach(pathPiece => partial = partial[pathPiece]);

    res = partial;
  } catch (e) {
    // noop;
  }
  return res;
}

export function findIndex(target, iteratee) {
  if (Array.isArray(target) && typeof iteratee === 'function')
    return target.findIndex(iteratee);

  return -1;
}

export function isString(obj) {
  return typeof obj === 'string' || obj instanceof String;
}

export function isFinite(val) {
  return typeof val == 'number' && Number.isFinite(val);
}

let uniqueIdCounter = -1;

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
