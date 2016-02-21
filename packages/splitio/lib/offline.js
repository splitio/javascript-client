'use strict';

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var help = '\nLooks you are not providing a valid set of settings! Let me show you a little snippet:\n\nvar localhost = {\n    features: {\n        my_cool_feature_name: \'version_a\',\n        another_feature_name: \'version_b\',\n        ...\n    }\n};\n\nvar sdk = splitio(localhost);\n\nsdk.getTreatment(\'my_cool_feature_name\') === \'version_a\'; // This is true!\nsdk.getTreatment(\'another_feature_name\') === \'version_b\'; // This is true!\nsdk.getTreatment(\'missing_feature_name\') === \'control\';   // This is true!\n\nLet\'s start hacking!\n';

var featuresAttributeMustBeAnObject = '\nHey! Please recheck features attribute, it should be an object with the\nfollowing shape:\n\nvar localhost = {\n  ===> features: {\n  ===>     my_cool_feature_name: \'version_a\',\n  ===>     another_feature_name: \'version_b\',\n  ===>     ...\n  ===> }\n};\n\nREMEMBER: any feature not present in this object will be evaluated as \'control\'\n';

var validIdentifier = /^[a-z][-_a-z0-9]*$/i;
function isIdentifierInvalid(str) {
  return !validIdentifier.test(str);
}

function splitio(localhost) {
  var typeOfLocalhost = typeof localhost === 'undefined' ? 'undefined' : (0, _typeof3.default)(localhost);
  var typeOfFeatures = typeOfLocalhost === 'undefined' ? 'undefined' : (0, _typeof3.default)(localhost.features);

  var _Object$assign = (0, _assign2.default)({
    features: {}
  }, localhost);

  var features = _Object$assign.features;


  if (typeOfLocalhost === 'undefined' || typeOfFeatures === 'undefined') {
    console.info(help);
  } else if (Object.prototype.toString.call(features) !== '[object Object]') {
    console.info(featuresAttributeMustBeAnObject);
    features = {};
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)((0, _entries2.default)(features)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = (0, _slicedToArray3.default)(_step.value, 2);

      var name = _step$value[0];
      var treatment = _step$value[1];

      if (isIdentifierInvalid(name)) {
        console.error('>\n>> Invalid feature name "' + name + '"\n>>>> Please check using ' + validIdentifier + '\n>\n');
        delete features[name];
      }

      if (isIdentifierInvalid(treatment)) {
        console.error('>\n>> Invalid treatment "' + treatment + '" in feature "' + name + '"\n>> Please check using ' + validIdentifier + ' and \'control\' is a reserved word\n>');
        delete features[name];
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return {
    getTreatment: function getTreatment() {
      if (arguments.length > 2 || arguments.length === 0) {
        console.error('Please verify the parameters, you could use getTreatment(featureName) or getTreatment(key, featureName)');

        return 'control';
      }

      // always the latest parameter is the feature name.
      var featureName = arguments.length <= arguments.length - 1 + 0 ? undefined : arguments[arguments.length - 1 + 0];
      var treatment = features[featureName];

      return typeof treatment === 'undefined' ? 'control' : treatment;
    }
  };
}

global.splitio = module.exports = splitio;
//# sourceMappingURL=offline.js.map