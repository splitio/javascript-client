'use strict';

const copyfiles = require('copyfiles');

const input = './src/**/package.json';
const outputCjsDir = './lib';
const outputEsmDir = './es';

copyfiles([input, process.env.NODE_ENV === 'cjs' ? outputCjsDir : outputEsmDir], {
  up: 1,
  exclude: './src/**/__tests__/**/package.json'
}, (err) => {
  if (err) {
    console.log('Error copying package.json files: ' + err);
    process.exit(1);
  } else {
    console.log('All package.json files copied correctly.');
    process.exit(0);
  }
});
