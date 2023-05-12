import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { isString, endsWith, find, forOwn, uniq, } from '@splitsoftware/splitio-commons/src/utils/lang';
import { parseCondition } from '@splitsoftware/splitio-commons/src/sync/offline/splitsParser/parseCondition';

const logPrefix = 'sync:offline:fetcher: ';

const DEFAULT_FILENAME = '.split';

function configFilesPath(configFilePath) {
  if (configFilePath === DEFAULT_FILENAME || !isString(configFilePath)) {
    let root = process.env.HOME;

    // @TODO env var not documented in help center
    if (process.env.SPLIT_CONFIG_ROOT) root = process.env.SPLIT_CONFIG_ROOT;

    if (!root) throw new Error('Missing root of the feature flags mock file.');

    configFilePath = path.join(root, DEFAULT_FILENAME);
  }

  // Validate the extensions
  if (!(endsWith(configFilePath, '.yaml', true) || endsWith(configFilePath, '.yml', true) || endsWith(configFilePath, '.split', true)))
    throw new Error(`Invalid extension specified for feature flags mock file. Accepted extensions are ".yml" and ".yaml". Your specified file is ${configFilePath}`);

  if (!fs.existsSync(configFilePath))
    throw new Error(`Feature flags mock file not found in ${configFilePath} - Please review the file location.`);

  return configFilePath;
}

// This function is not pure nor meant to be. Here we apply modifications to cover
// for behaviour that's ensured by the BE.
function arrangeConditions(mocksData) {
  // Iterate through each feature flag data
  forOwn(mocksData, data => {
    const conditions = data.conditions;

    // On the manager, as feature flag JSONs come with all treatments on the partitions prop,
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

  // Parse `.split` configuration file and return a map of feature flag objects
  function readFeatureFlagConfigFile(log, filePath) {
    const FEATURE_FLAG_POSITION = 0;
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

    const featureFlagObjects = data.split(/\r?\n/).reduce((accum, line, index) => {
      let tuple = line.trim();

      if (tuple === '' || tuple.charAt(0) === '#') {
        log.debug(logPrefix + `Ignoring empty line or comment at #${index}`);
      } else {
        tuple = tuple.split(/\s+/);

        if (tuple.length !== 2) {
          log.debug(logPrefix + `Ignoring line since it does not have exactly two columns #${index}`);
        } else {
          const featureFlagName = tuple[FEATURE_FLAG_POSITION];
          const condition = parseCondition({ treatment: tuple[TREATMENT_POSITION] });
          accum[featureFlagName] = { conditions: [condition], configurations: {}, trafficTypeName: 'localhost' };
        }
      }

      return accum;
    }, {});

    return featureFlagObjects;
  }

  // Parse `.yml` or `.yaml` configuration files and return a map of feature flag objects
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
    const mocksData = (yamldoc).reduce((accum, featureFlagEntry) => {
      const featureFlagName = Object.keys(featureFlagEntry)[0];

      if (!featureFlagName || !isString(featureFlagEntry[featureFlagName].treatment))
        log.error(logPrefix + 'Ignoring entry on YAML since the format is incorrect.');

      const mockData = featureFlagEntry[featureFlagName];

      // "Template" for each feature flag accumulated data
      if (!accum[featureFlagName]) {
        accum[featureFlagName] = {
          configurations: {}, conditions: [], treatments: [], trafficTypeName: 'localhost'
        };
      }

      // Assign the config if there is one on the mock
      if (mockData.config) accum[featureFlagName].configurations[mockData.treatment] = mockData.config;
      // Parse the condition from the entry.
      const condition = parseCondition(mockData);
      accum[featureFlagName].conditions[condition.conditionType === 'ROLLOUT' ? 'push' : 'unshift'](condition);
      // Also keep track of the treatments, will be useful for manager functionality.
      accum[featureFlagName].treatments.push(mockData.treatment);

      return accum;
    }, {});

    arrangeConditions(mocksData);

    return mocksData;
  }

  // Load the content of a configuration file into an Object
  return function featureFlagsParserFromFile({ features, log }) {
    const filePath = configFilesPath(features);
    let mockData;

    // If we have a filePath, it means the extension is correct, choose the parser.
    if (endsWith(filePath, '.split')) {
      log.warn(logPrefix + '.split mocks will be deprecated soon in favor of YAML files, which provide more targeting power. Take a look in our documentation.');
      mockData = readFeatureFlagConfigFile(log, filePath);
    } else {
      mockData = readYAMLConfigFile(log, filePath);
    }

    return mockData;
  };

}
