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

// @flow

'use strict';

const fs = require('fs');
const path = require('path');
const log = require('../../../utils/logger')('splitio:offline');

const FILENAME = '.split';

// Lookup for `.split` in process.env.SPLIT_CONFIG_ROOT or process.env.HOME as
// fallback.
function configFilesPath(config = {}) {
  let root = process.env.HOME;

  if (process.env.SPLIT_CONFIG_ROOT) root = process.env.SPLIT_CONFIG_ROOT;

  if (!root) throw 'Missing split configuration root';

  let configFilePath = path.join(root, FILENAME);

  if (typeof config.features === 'string') configFilePath = config.features;

  if (!fs.existsSync(configFilePath)) throw `Split configuration not found in ${configFilePath}`;

  return configFilePath;
}

// Parse `.split` configuration file and return an array of split => treatments
function readSplitConfigFile(path: string): Array<Array<string>> {
  let data;

  try {
    data = fs.readFileSync(path, 'utf-8');
  } catch (e) {
    log.error(e.message);

    return [];
  }

  let validLines = data.split(/\r?\n/).reduce((accum, line, index) => {
    let tuple = line.trim();

    if (tuple === '' || tuple.charAt(0) === '#') {
      log.debug(`Ignoring empty line or comment at #${index}`);
    } else {
      tuple = tuple.split(/\s+/);

      if (tuple.length !== 2) {
        log.debug(`Ignoring line since it does not have exactly two columns #${index}`);
      } else {
        accum.push(tuple);
      }
    }

    return accum;
  }, []);

  return validLines;
}

// Array to Object conversion
function makeUpReadOnlySettings(lines: Array<Array<string>>): Object {
  const SPLIT = 0;
  const TREATMENT = 1;

  return lines.reduce((accum, line) => {
    return accum[line[SPLIT]] = line[TREATMENT], accum;
  }, {});
}

// Load the content of a configuration file into an Object
function getSplitConfigForFile(settings: Settings): Object {
  return makeUpReadOnlySettings(readSplitConfigFile(configFilesPath(settings)));
}

module.exports = getSplitConfigForFile;
