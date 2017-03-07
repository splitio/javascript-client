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
    // in v8, this is an attribute instead of a function.
    ready() {
      return client.ready;
    },
    // This is new to v8, and this method is at the same level as `.client`.
    manager,
    // Keeps the same in v8.
    settings
  });
}

module.exports = splitio;
