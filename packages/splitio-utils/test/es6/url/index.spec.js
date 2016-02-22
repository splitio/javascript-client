'use strict';

let tape = require('tape');
let url = require('../../../lib/url');

tape('URL / check development url', assert => {
  process.env.NODE_ENV = 'development';
  assert.true(url('/test'), 'http://localhost:8081/api/test');
  assert.end();
});

tape('URL / check stage url', assert => {
  process.env.NODE_ENV = 'stage';
  assert.true(url('/test'), 'https://sdk-staging.split.io/api/test');
  assert.end();
});

tape('URL / check production url', assert => {
  process.env.NODE_ENV = 'production';
  assert.true(url('/test'), 'https://sdk.split.io/api/test');
  assert.end();
});

tape('URL / check loadtesting url', assert => {
  process.env.NODE_ENV = 'loadtesting';
  assert.true(url('/test'), 'http://sdk-loadtesting.split.io/api/test');
  assert.end();
});
