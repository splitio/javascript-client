import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { isString, endsWith, find, forOwn, uniq, } from '@splitsoftware/splitio-commons/src/utils/lang';
import { parseCondition } from '@splitsoftware/splitio-commons/src/sync/offline/splitsParser/parseCondition';

const logPrefix = 'sync:offline:splits-fetcher: ';

const DEFAULT_FILENAME = '.split';

function configFilesPath(configFilePath) {
  if (configFilePath === DEFAULT_FILENAME || !isString(configFilePath)) {
    let root = process.env.HOME;

    if (process.env.SPLIT_CONFIG_ROOT) root = process.env.SPLIT_CONFIG_ROOT;

    if (!root) throw new Error('Missing split mock configuration root.');

    configFilePath = path.join(root, DEFAULT_FILENAME);
  }

  // Validate the extensions
  if (!(endsWith(configFilePath, '.yaml', true) || endsWith(configFilePath, '.yml', true) || endsWith(configFilePath, '.split', true)))
    throw new Error(`Invalid extension specified for Splits mock file. Accepted extensions are ".yml" and ".yaml". Your specified file is ${configFilePath}`);

  if (!fs.existsSync(configFilePath))
    throw new Error(`Split configuration not found in ${configFilePath} - Please review your Split file location.`);

  return configFilePath;
}

// This function is not pure nor meant to be. Here we apply modifications to cover
// for behaviour that's ensured by the BE.
function arrangeConditions(mocksData) {
  // Iterate through each Split data
  forOwn(mocksData, data => {
    const conditions = data.conditions;

    // On the manager, as the split jsons come with all treatments on the partitions prop,
    // we'll add all the treatments to the first condition.
    const firstRolloutCondition = find(conditions, cond => cond.conditionType === 'ROLLOUT');
    // Malformed mocks may have
    const treatments = uniq(data.treatments);
    // If they're only specifying a whitelist we add the treatments there.
    const allTreatmentsCondition = firstRolloutCondition ? firstRolloutCondition : conditions[0];

    const fullyAllocatedTreatment = allTreatmentsCondition.partitions[0].treatment;

    treatments.forEach(treatment => {
      if (treatment !== fullyAllocatedTreatment) {
        allTreatmentsCondition.partitions.push({
          treatment, size: 0
        });
      }
    });

    // Don't need these anymore
    delete data.treatments;
  });
}

export function splitsParserFromFileFactory() {

  let previousMock = 'NO_MOCK_LOADED';

  // Parse `.split` configuration file and return a map of "Split Objects"
  function readSplitConfigFile(log, filePath) {
    const SPLIT_POSITION = 0;
    const TREATMENT_POSITION = 1;
    let data;

    try {
      data = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      log.error(e && e.message);

      return {};
    }

    if (data === previousMock) return false;
    previousMock = data;

    const splitObjects = data.split(/\r?\n/).reduce((accum, line, index) => {
      let tuple = line.trim();

      if (tuple === '' || tuple.charAt(0) === '#') {
        log.debug(logPrefix + `Ignoring empty line or comment at #${index}`);
      } else {
        tuple = tuple.split(/\s+/);

        if (tuple.length !== 2) {
          log.debug(logPrefix + `Ignoring line since it does not have exactly two columns #${index}`);
        } else {
          const splitName = tuple[SPLIT_POSITION];
          const condition = parseCondition({ treatment: tuple[TREATMENT_POSITION] });
          accum[splitName] = { conditions: [condition], configurations: {}, trafficTypeName: 'localhost' };
        }
      }

      return accum;
    }, {});

    return splitObjects;
  }

  // Parse `.yml` or `.yaml` configuration files and return a map of "Split Objects"
  function readYAMLConfigFile(log, filePath) {
    let data = '';
    let yamldoc = null;

    try {
      data = fs.readFileSync(filePath, 'utf8');

      if (data === previousMock) return false;
      previousMock = data;

      yamldoc = yaml.safeLoad(data);
    } catch (e) {
      log.error(e);

      return {};
    }

    // Each entry will be mapped to a condition, but we'll also keep the configurations map.
    const mocksData = (yamldoc).reduce((accum, splitEntry) => {
      const splitName = Object.keys(splitEntry)[0];

      if (!splitName || !isString(splitEntry[splitName].treatment))
        log.error(logPrefix + 'Ignoring entry on YAML since the format is incorrect.');

      const mockData = splitEntry[splitName];

      // "Template" for each split accumulated data
      if (!accum[splitName]) {
        accum[splitName] = {
          configurations: {}, conditions: [], treatments: [], trafficTypeName: 'localhost'
        };
      }

      // Assign the config if there is one on the mock
      if (mockData.config) accum[splitName].configurations[mockData.treatment] = mockData.config;
      // Parse the condition from the entry.
      const condition = parseCondition(mockData);
      accum[splitName].conditions[condition.conditionType === 'ROLLOUT' ? 'push' : 'unshift'](condition);
      // Also keep track of the treatments, will be useful for manager functionality.
      accum[splitName].treatments.push(mockData.treatment);

      return accum;
    }, {});

    arrangeConditions(mocksData);

    return mocksData;
  }

  // Load the content of a configuration file into an Object
  return function splitsParserFromFile({ features, log }) {
    const filePath = configFilesPath(features);
    let mockData;

    // If we have a filePath, it means the extension is correct, choose the parser.
    if (endsWith(filePath, '.split')) {
      log.warn(logPrefix + '.split mocks will be deprecated soon in favor of YAML files, which provide more targeting power. Take a look in our documentation.');
      mockData = readSplitConfigFile(log, filePath);
    } else {
      mockData = readYAMLConfigFile(log, filePath);
    }

    return mockData;
  };

}
