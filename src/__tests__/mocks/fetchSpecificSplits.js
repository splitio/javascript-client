export const valuesExamples = [
  ['\u0223abc', 'abc\u0223asd', 'abc\u0223'],
  ['ausgefüllt'],
  ['abc\u0223', 'abc\u0223asd', 'ausgefüllt', '\u0223abc'] // [0] + [1] ordered
];

export const splitFilters = [
  [
    { type: 'byName', values: valuesExamples[0] },
    { type: 'byName', values: valuesExamples[1] },
    { type: 'byPrefix', values: [] }
  ],
  [
    { type: 'byPrefix', values: valuesExamples[0] },
    { type: 'byPrefix', values: valuesExamples[1] },
    { type: 'byName', values: [] }
  ],
  [
    { type: 'byName', values: valuesExamples[0] },
    { type: 'byName', values: valuesExamples[1] },
    { type: 'byPrefix', values: valuesExamples[0] },
    { type: 'byPrefix', values: valuesExamples[1] }
  ]
];

export const queryStrings = [
  'names=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc',
  'prefixes=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc',
  'names=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc&prefixes=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc'
];

export const filters = [
  {
    byName: valuesExamples[2],
    byPrefix: undefined
  },
  {
    byName: undefined,
    byPrefix: valuesExamples[2]
  },
  {
    byName: valuesExamples[2],
    byPrefix: valuesExamples[2]
  },
];