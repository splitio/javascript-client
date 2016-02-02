/* @flow */ 'use strict';

let TREATMENT_RESERVED_WORDS = {
  CONTROL: 'control',
  OFF: 'off',

  isOn(treatment) {
    return treatment !== this.OFF && treatment !== this.CONTROL;
  }
};

module.exports = TREATMENT_RESERVED_WORDS;
