export const jwtSample = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImtleUlkIiwidHlwIjoiSldUIn0.eyJvcmdJZCI6IjEyMTM4YWMxLTA5MmYtMzJlNy1iYTc4LTEyMzk1ZDRhOTYzNCIsImVudklkIjoiODZiMGQzYTAtNWY1NC0zMmU3LTIyZjktMDExNTBmYTlmYTNhIiwieC1hYmx5LWNhcGFiaWxpdHkiOiJ7XCJOek0yTURJNU16YzBfTXpReU9EVTRORFV5Tmc9PV9zZWdtZW50c1wiOltcInN1YnNjcmliZVwiXSxcIk56TTJNREk1TXpjMF9NelF5T0RVNE5EVXlOZz09X3NwbGl0c1wiOltcInN1YnNjcmliZVwiXSxcImNvbnRyb2xcIjpbXCJzdWJzY3JpYmVcIl19IiwieC1hYmx5LWNsaWVudElkIjoiY2xpZW50SWQiLCJleHAiOjE1ODM3ODcxMjQsImlhdCI6MTU4Mzc4MzUyNH0.f3I0ADc3kzQ4RfFywEukBM8bw91AUnJcGH3nwYUjEg0';
export const jwtSampleInvalid = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImtleUlkIiwidHlwIjoiSldUIn0.aaavcmdJZCI6IjEyMTM4YWMxLTA5MmYtMzJlNy1iYTc4LTEyMzk1ZDRhOTYzNCIsImVudklkIjoiODZiMGQzYTAtNWY1NC0zMmU3LTIyZjktMDExNTBmYTlmYTNhIiwieC1hYmx5LWNhcGFiaWxpdHkiOiJ7XCJOek0yTURJNU16YzBfTXpReU9EVTRORFV5Tmc9PV9zZWdtZW50c1wiOltcInN1YnNjcmliZVwiXSxcIk56TTJNREk1TXpjMF9NelF5T0RVNE5EVXlOZz09X3NwbGl0c1wiOltcInN1YnNjcmliZVwiXSxcImNvbnRyb2xcIjpbXCJzdWJzY3JpYmVcIl19IiwieC1hYmx5LWNsaWVudElkIjoiY2xpZW50SWQiLCJleHAiOjE1ODM3ODcxMjQsImlhdCI6MTU4Mzc4MzUyNH0.f3I0ADc3kzQ4RfFywEukBM8bw91AUnJcGH3nwYUjEg0';
export const jwtSampleNoChannels = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImtleUlkIiwidHlwIjoiSldUIn0.eyJvcmdJZCI6IjEyMTM4YWMxLTA5MmYtMzJlNy1iYTc4LTEyMzk1ZDRhOTYzNCIsImVudklkIjoiODZiMGQzYTAtNWY1NC0zMmU3LTIyZjktMDExNTBmYTlmYTNhIiwieC1hYmx5LWNsaWVudElkIjoiY2xpZW50SWQiLCJleHAiOjE1ODM3ODcxMjQsImlhdCI6MTU4Mzc4MzUyNH0.aiuUdeBAZaFMtgaH9y9cwxPG3LyiJCGpX54jd1V4Z54';
export const jwtSampleNoIat = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImtleUlkIiwidHlwIjoiSldUIn0.eyJvcmdJZCI6IjEyMTM4YWMxLTA5MmYtMzJlNy1iYTc4LTEyMzk1ZDRhOTYzNCIsImVudklkIjoiODZiMGQzYTAtNWY1NC0zMmU3LTIyZjktMDExNTBmYTlmYTNhIiwieC1hYmx5LWNhcGFiaWxpdHkiOiJ7XCJOek0yTURJNU16YzBfTXpReU9EVTRORFV5Tmc9PV9zZWdtZW50c1wiOltcInN1YnNjcmliZVwiXSxcIk56TTJNREk1TXpjMF9NelF5T0RVNE5EVXlOZz09X3NwbGl0c1wiOltcInN1YnNjcmliZVwiXSxcImNvbnRyb2xcIjpbXCJzdWJzY3JpYmVcIl19IiwieC1hYmx5LWNsaWVudElkIjoiY2xpZW50SWQiLCJleHAiOjE1ODM3ODcxMjQsImlhdCI6IjE1ODM3ODM1MjQifQ';

export const decodedJwtPayloadSample = {
  orgId: '12138ac1-092f-32e7-ba78-12395d4a9634',
  envId: '86b0d3a0-5f54-32e7-22f9-01150fa9fa3a',
  ['x-ably-capability']: '{"NzM2MDI5Mzc0_MzQyODU4NDUyNg==_segments":["subscribe"],"NzM2MDI5Mzc0_MzQyODU4NDUyNg==_splits":["subscribe"],"control":["subscribe"]}',
  ['x-ably-clientId']: 'clientId',
  exp: 1583787124,
  iat: 1583783524,
};

export const decodedJwtHeadersSample = {
  alg: 'HS256',
  kid: 'keyId',
  typ: 'JWT',
};

export const parsedChannelsSample = {
  'NzM2MDI5Mzc0_MzQyODU4NDUyNg==_segments': ['subscribe'],
  'NzM2MDI5Mzc0_MzQyODU4NDUyNg==_splits': ['subscribe'],
  'control': ['subscribe']
};

export const base64sample = 'ZW1pQHNwbGl0Lmlv';

export const decodedBase64sample = 'emi@split.io';

export const authDataResponseSample = {
  pushEnabled: true,
  token: jwtSample,
};

export const authDataSample = {
  ...authDataResponseSample,
  decodedToken: decodedJwtPayloadSample,
  channels: parsedChannelsSample,
};

export const userKeySample = 'emi@split.io';

export const userKeyBase64HashSample = 'MjAxNjU2NDU5Mw==';

export const channelsQueryParamSample = 'NzM2MDI5Mzc0_MzQyODU4NDUyNg%3D%3D_segments,NzM2MDI5Mzc0_MzQyODU4NDUyNg%3D%3D_splits,control';

export const keylists = [
  {
    compression: 1, // GZIP
    keyListDataCompressed: 'H4sIAAAAAAAA/wTAsRHDUAgD0F2ofwEIkPAqPhdZIW0uu/v97GPXHU004ULuMGrYR6XUbIjlXULPPse+dt1yhJibBODjrTmj3GJ4emduuDDP/w0AAP//18WLsl0AAAA=',
    keyListData: { a: ['1573573083296714675', '8482869187405483569'], r: ['8031872927333060586', '6829471020522910836'] },
    addedUserKeys: ['key1', 'key2'],
    removedUserKeys: ['key3', 'key4'],
    otherUserKeys: ['key5', 'key6']
  }
];

export const bitmaps = [
  {
    compression: 1, // GZIP
    bitmapDataCompressed: 'H4sIAAAAAAAA/2JABxzYeIxQLguYFIBLN8Bl4EABjc+EzOnAsA4QAAD//8YBvWeAAAAA',
    bitmapData: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 136, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    trueUserKeys: [
      '88f8b33b-f858-4aea-bea2-a5f066bab3ce',
      '603516ce-1243-400b-b919-0dce5d8aecfd',
      '4588c4f6-3d18-452a-bc4a-47d7abfd23df',
      '42bcfe02-d268-472f-8ed5-e6341c33b4f7',
      '4b0b0467-3fe1-43d1-a3d5-937c0a5473b1',
      '2a7cae0e-85a2-443e-9d7c-7157b7c5960a',
      '18c936ad-0cd2-490d-8663-03eaa23a5ef1',
      '09025e90-d396-433a-9292-acef23cf0ad1',
      'bfd4a824-0cde-4f11-9700-2b4c5ad6f719',
      '2b79d5df-b65a-d25d-75d7-05877f69d976',
      '375903c8-6f62-4272-88f1-f8bcd304c7ae'
    ],
    falseUserKeys: [
      '88f8b33b-f858-4aea-bea2-a5f066bab3c0',
      '603516ce-1243-400b-b919-0dce5d8aecf0',
      '4588c4f6-3d18-452a-bc4a-47d7abfd23d0',
      '42bcfe02-d268-472f-8ed5-e6341c33b4fc',
      '4b0b0467-3fe1-43d1-a3d5-937c0a5473b5',
      '2a7cae0e-85a2-443e-9d7c-7157b7c59606',
      '18c936ad-0cd2-490d-8663-03eaa23a5ef0',
      '09025e90-d396-433a-9292-acef23cf0ad0',
      'bfd4a824-0cde-4f11-9700-2b4c5ad6f710',
      '2b79d5df-b65a-d25d-75d7-05877f69d970',
      '375903c8-6f62-4272-88f1-f8bcd304c7a1'
    ]
  }, {
    compression: 2, // ZLIB
    bitmapDataCompressed: 'eJxiGAX4AMdAO2AU4AeMA+2AAQACA+0AuoORGMvDBDANtAPoDBQG2gGDGQz16pRloB0wCkbBKBgFo4As0EBYyZCqoojwDwEACAAA//+W/QFR',
    trueUserKeys: [
      '88f8b33b-f858-4aea-bea2-a5f066bab3ce',
      '603516ce-1243-400b-b919-0dce5d8aecfd',
      '4588c4f6-3d18-452a-bc4a-47d7abfd23df',
      '42bcfe02-d268-472f-8ed5-e6341c33b4f7',
      '4b0b0467-3fe1-43d1-a3d5-937c0a5473b1',
      '2a7cae0e-85a2-443e-9d7c-7157b7c5960a',
      '18c936ad-0cd2-490d-8663-03eaa23a5ef1',
      '09025e90-d396-433a-9292-acef23cf0ad1',
      'bfd4a824-0cde-4f11-9700-2b4c5ad6f719',
      '2b79d5df-b65a-d25d-75d7-05877f69d976',
      '375903c8-6f62-4272-88f1-f8bcd304c7ae'
    ],
    falseUserKeys: [
      '88f8b33b-f858-4aea-bea2-a5f066bab3c1',
      '603516ce-1243-400b-b919-0dce5d8aecf2',
      '4588c4f6-3d18-452a-bc4a-47d7abfd23d3',
      '42bcfe02-d268-472f-8ed5-e6341c33b4f4',
      '4b0b0467-3fe1-43d1-a3d5-937c0a5473b5',
      '2a7cae0e-85a2-443e-9d7c-7157b7c59606',
      '18c936ad-0cd2-490d-8663-03eaa23a5ef7',
      '09025e90-d396-433a-9292-acef23cf0ad8',
      'bfd4a824-0cde-4f11-9700-2b4c5ad6f710',
      '2b79d5df-b65a-d25d-75d7-05877f69d97a',
      '375903c8-6f62-4272-88f1-f8bcd304c7ab'
    ]
  }, {
    compression: 2, // ZLIB
    bitmapDataCompressed: 'eJzMVk3OhDAIVdNFl9/22zVzEo8yR5mjT6LGsRTKg2LiW8yPUnjQB+2kIwM2ThTIKtVU1oknFcRzufz+YGYM/phnHW8sdPvs9EzXW2I+HFzhNyTNgCD/PpW9xpGiHD0Bw1U5HLSS644FbGZgoPovmjpmX5wAzhIxJyN7IAnFQWX1htj+LUl6ZQRV3umMqYG1LCrOJGLPV8+IidBQZFt6sOUA6CqsX5iEFY2gqufs2mfqRtsVWytRnO+iYMN7xIBqJhDqAydV+HidkGOGEJYvk4fhe/8iIukphG/XfFcfVxnMVcALCOF77qL/EU7ODepxlLST6qxFLYRdOyW8EBY4BqVjObnm3V5ZMkZIKf++8+hM7zM1Kd3aFqVZeSHzDQAA//+QUQ3a',
    trueUserKeys: [
      'user1',
      'user2',
      'user3',
      'user4',
      'user5',
      'user6',
      'user7',
      'user8',
      'user9',
      'user10',
      'user11',
      'user12',
      'user13',
      'user14',
      'user15',
      'user16',
      'user17',
      'user18',
      'user19',
      'user20',
      'user21',
      'user22',
      'user23',
      'user24',
      'user25',
      'user26',
      'user27',
      'user28',
      'user29',
      'user30',
      'user31',
      'user32',
      'user33',
      'user34',
      'user35',
      'user36',
      'user37',
      'user38',
      'user39',
      'user40',
      'user41',
      'user42',
      'user43',
      'user44',
      'user45',
      'user46',
      'user47',
      'user48',
      'user49',
      'user50',
      'user51',
      'user52',
      'user53',
      'user54',
      'user55',
      'user56',
      'user57',
      'user58',
      'user59',
      'user60',
      'user61',
      'user62',
      'user63',
      'user64',
      'user65',
      'user66',
      'user67',
      'user68',
      'user69',
      'user70',
      'user71',
      'user72',
      'user73',
      'user74',
      'user75',
      'user76',
      'user77',
      'user78',
      'user79',
      'user80',
      'user81',
      'user82',
      'user83',
      'user84',
      'user85',
      'user86',
      'user87',
      'user88',
      'user89',
      'user90',
      'user91',
      'user92',
      'user93',
      'user94',
      'user95',
      'user96',
      'user97',
      'user98',
      'user99',
      'user100',
      'user101',
      'user102',
      'user103',
      'user104',
      'user105',
      'user106',
      'user107',
      'user108',
      'user109',
      'user110',
      'user111',
      'user112',
      'user113',
      'user114',
      'user115',
      'user116',
      'user117',
      'user118',
      'user119',
      'user120',
    ],
    falseUserKeys: [
      'user',
      'user0',
      'user121',
      'user122',
    ]
  }
];
