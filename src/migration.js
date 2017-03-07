const splitFactory = require('./');

//
// @DEPRECATED
//
// Migration support for seamless migration between v7 to v8 even exposing new
// apis.
//
function splitio(config: Object) {
  const factory = splitFactory(config);
  const client = factory.client();
  const manager = client.manager;
  const settings = factory.settings;

  return Object.assign(Object.create(client), {
    // Keeps the same in v8.
    settings
  });
}

module.exports = splitio;
