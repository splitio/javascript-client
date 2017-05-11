'use strict';

const copyfiles = require('copyfiles');

const input = './src/**/package.json';
const outputDir = './lib';

copyfiles([input, outputDir], {
  up: 1
}, (err) => {
  if (err) {
    console.log('Error copying package.json files: ' + err);
    process.exit(1);
  } else {
    console.log('All package.json files copied correctly.');
    process.exit(0);
  }
});
