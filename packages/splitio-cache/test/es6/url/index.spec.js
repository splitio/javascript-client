'use strict';

let tape = require('tape');
let url = require('../../../lib/url');

let NODE_ENV = process.env.NODE_ENV;

tape('url for development', assert => {
  process.env.NODE_ENV = 'development';
  assert.true(url('/test'), 'http://localhost:8081/api/test');
  assert.end();
});

tape('url for stage', assert => {
  process.env.NODE_ENV = 'stage';
  assert.true(url('/test'), 'https://sdk-staging.split.io/api/test');
  assert.end();
});

tape('url for production', assert => {
  process.env.NODE_ENV = 'production';
  assert.true(url('/test'), 'https://sdk.split.io/api/test');
  assert.end();
});

process.env.NODE_ENV = NODE_ENV;
