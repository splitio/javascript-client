'use strict';

let splitNode = require('./node');

global.splitio = function splitBrowser(settings /*: object */) /*: object */ {
  let engine = splitNode(settings);

  engine.getTreatment = engine.getTreatment.bind(engine, settings.core.key);

  return engine;
};
