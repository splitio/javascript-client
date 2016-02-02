/* @flow */'use strict';

var TREATMENT_RESERVED_WORDS = {
  CONTROL: 'control',
  OFF: 'off',

  isOn: function isOn(treatment) {
    return treatment !== this.OFF && treatment !== this.CONTROL;
  }
};

module.exports = TREATMENT_RESERVED_WORDS;
//# sourceMappingURL=reserved.js.map