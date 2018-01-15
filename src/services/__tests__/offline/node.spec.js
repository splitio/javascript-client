// @flow

'use strict';

const path = require('path');

const tape = require('tape-catch');
const getSplitConfigForFile = require('../../splitChanges/offline');

tape('CONFIGURATION READER / Load .split file given a path', function (assert) {
  const config = {
    core: {
      authorizationKey: 'localhost'
    },
    features: path.join(__dirname, '.split')
  };
  const splits = getSplitConfigForFile(config);

  assert.true(splits.testing_split === 'A');
  assert.end();
});

tape('CONFIGURATION READER / Load .split using SPLIT_CONFIG_ROOT env variable', function (assert) {
  process.env.SPLIT_CONFIG_ROOT = __dirname;

  const splits = getSplitConfigForFile();

  delete process.env.SPLIT_CONFIG_ROOT;

  assert.true(splits.testing_split === 'A');
  assert.end();
});

tape('CONFIGURATION READER / Load .split using HOME env variable', function (assert) {
  let aux = process.env.HOME;

  process.env.HOME = __dirname;

  const splits = getSplitConfigForFile();

  process.env.HOME = aux;

  assert.true(splits.testing_split === 'A');
  assert.end();
});
