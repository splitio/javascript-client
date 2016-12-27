/**
 * When installing the module and using it with PM2 the require lookup algorithm
 * is not jumping more than once. In order to workaround this, I'm defining this
 * file to correctly resolve to the implementation for nodejs.
 */
module.exports = require('./node');
