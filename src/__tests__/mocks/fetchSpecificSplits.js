const valuesExamples = [
  ['\u0223abc', 'abc\u0223asd', 'abc\u0223'],
  ['ausgefüllt'],
  ['abc\u0223', 'abc\u0223asd', 'ausgefüllt', '\u0223abc'], // [0] + [1] ordered
  ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12', 's13', 's14', 's15', 's16', 's17', 's18', 's19', 's20', 's21', 's22', 's23', 's24', 's25', 's26', 's27', 's28', 's29', 's30', 's31', 's32', 's33', 's34', 's35', 's36', 's37', 's38', 's39', 's40', 's41', 's42', 's43', 's44', 's45', 's46', 's47', 's48', 's49', 's50', 's51', 's52', 's53', 's54', 's55', 's56', 's57', 's58', 's59', 's60', 's61', 's62', 's63', 's64', 's65', 's66', 's67', 's68', 's69', 's70', 's71', 's72', 's73', 's74', 's75', 's76', 's77', 's78', 's79', 's80', 's81', 's82', 's83', 's84', 's85', 's86', 's87', 's88', 's89', 's90', 's91', 's92', 's93', 's94', 's95', 's96', 's97', 's98', 's99', 's100', 's101', 's102', 's103', 's104', 's105', 's106', 's107', 's108', 's109', 's110', 's111', 's112', 's113', 's114', 's115', 's116', 's117', 's118', 's119', 's120', 's121', 's122', 's123', 's124', 's125', 's126', 's127', 's128', 's129', 's130', 's131', 's132', 's133', 's134', 's135', 's136', 's137', 's138', 's139', 's140', 's141', 's142', 's143', 's144', 's145', 's146', 's147', 's148', 's149', 's150', 's151', 's152', 's153', 's154', 's155', 's156', 's157', 's158', 's159', 's160', 's161', 's162', 's163', 's164', 's165', 's166', 's167', 's168', 's169', 's170', 's171', 's172', 's173', 's174', 's175', 's176', 's177', 's178', 's179', 's180', 's181', 's182', 's183', 's184', 's185', 's186', 's187', 's188', 's189', 's190', 's191', 's192', 's193', 's194', 's195', 's196', 's197', 's198', 's199'],
  ['s200', 's201', 's202', 's203', 's204', 's205', 's206', 's207', 's208', 's209', 's210', 's211', 's212', 's213', 's214', 's215', 's216', 's217', 's218', 's219', 's220', 's221', 's222', 's223', 's224', 's225', 's226', 's227', 's228', 's229', 's230', 's231', 's232', 's233', 's234', 's235', 's236', 's237', 's238', 's239', 's240', 's241', 's242', 's243', 's244', 's245', 's246', 's247', 's248', 's249', 's250', 's251', 's252', 's253', 's254', 's255', 's256', 's257', 's258', 's259', 's260', 's261', 's262', 's263', 's264', 's265', 's266', 's267', 's268', 's269', 's270', 's271', 's272', 's273', 's274', 's275', 's276', 's277', 's278', 's279', 's280', 's281', 's282', 's283', 's284', 's285', 's286', 's287', 's288', 's289', 's290', 's291', 's292', 's293', 's294', 's295', 's296', 's297', 's298', 's299', 's300', 's301', 's302', 's303', 's304', 's305', 's306', 's307', 's308', 's309', 's310', 's311', 's312', 's313', 's314', 's315', 's316', 's317', 's318', 's319', 's320', 's321', 's322', 's323', 's324', 's325', 's326', 's327', 's328', 's329', 's330', 's331', 's332', 's333', 's334', 's335', 's336', 's337', 's338', 's339', 's340', 's341', 's342', 's343', 's344', 's345', 's346', 's347', 's348', 's349', 's350', 's351', 's352', 's353', 's354', 's355', 's356', 's357', 's358', 's359', 's360', 's361', 's362', 's363', 's364', 's365', 's366', 's367', 's368', 's369', 's370', 's371', 's372', 's373', 's374', 's375', 's376', 's377', 's378', 's379', 's380', 's381', 's382', 's383', 's384', 's385', 's386', 's387', 's388', 's389', 's390', 's391', 's392', 's393', 's394', 's395', 's396', 's397', 's398', 's399'],
  ['s401'],
  ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17', 'p18', 'p19', 'p20', 'p21', 'p22', 'p23', 'p24', 'p25', 'p26', 'p27', 'p28', 'p29', 'p30', 'p31', 'p32', 'p33', 'p34', 'p35', 'p36', 'p37', 'p38', 'p39', 'p40', 'p41', 'p42', 'p43', 'p44', 'p45', 'p46', 'p47', 'p48', 'p49', 'p50']
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
  ],
  // 401 'byName' unique values
  [
    { type: 'byName', values: valuesExamples[3] },
    { type: 'byName', values: valuesExamples[4] },
    { type: 'byName', values: valuesExamples[5] }
  ],
  // 51 'byPrefix' unique values
  [
    { type: 'byPrefix', values: valuesExamples[6] }
  ]
];

// each entry corresponds to the queryString or exception message of each splitFilters entry
export const queryStrings = [
  '&names=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc',
  '&prefixes=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc',
  '&names=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc&prefixes=abc%C8%A3,abc%C8%A3asd,ausgef%C3%BCllt,%C8%A3abc',
  "400 unique values can be specified at most for 'byName' filter. You passed 401. Please consider reducing the amount or using other filter.",
  "50 unique values can be specified at most for 'byPrefix' filter. You passed 51. Please consider reducing the amount or using other filter.",
];

// each entry corresponds to the `validateSplitFilter` output for each `splitFilters` input.
// An `undefined` value means that `validateSplitFilter` throws an exception which message value is at `queryStrings`.
export const groupedFilters = [
  {
    byName: valuesExamples[2],
    byPrefix: []
  },
  {
    byName: [],
    byPrefix: valuesExamples[2]
  },
  {
    byName: valuesExamples[2],
    byPrefix: valuesExamples[2]
  },
  undefined,
  undefined,
];