
module.exports = (function () {
  if (typeof performance === 'object' && typeof performance.now === 'function') {
    return performance.now.bind(performance);
  } else {
    return Date.now;
  }
}());
