'use strict';

/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

var fs = require('fs');
var path = require('path');
var log = require('debug')('splitio:offline');

var FILENAME = '.split';

var baseOfflineFactory = require('./base');

function configFilesPath() {
  return path.join(process.env.HOME, FILENAME);
}

function readSplitConfigFile(path) {
  var data = void 0;

  try {
    data = fs.readFileSync(path, 'utf-8');
  } catch (e) {
    log(e.message);

    return [];
  }

  var validLines = data.split(/\r?\n/).reduce(function (accum, line, index) {
    var tuple = line.trim();

    if (tuple === '' || tuple.charAt(0) === '#') {
      log('Ignoring empty line or comment at #' + index);
    } else {
      tuple = tuple.split(/\s+/);

      if (tuple.length !== 2) {
        log('Ignoring line since it does not have exactly two columns #' + index);
      } else {
        accum.push(tuple);
      }
    }

    return accum;
  }, []);

  return validLines;
}

function makeUpReadOnlySettings(lines) {
  var SPLIT = 0;
  var TREATMENT = 1;

  return lines.reduce(function (accum, line) {
    return accum[line[SPLIT]] = line[TREATMENT], accum;
  }, {});
}

function getSplitConfigForFile() {
  return makeUpReadOnlySettings(readSplitConfigFile(configFilesPath()));
}

function nodeOfflineFactory(settings) {
  settings.features = getSplitConfigForFile();

  return baseOfflineFactory(settings);
}

module.exports = nodeOfflineFactory;