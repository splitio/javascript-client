'use strict';

console.log('SPLIT DEMO!');

splitio.start('epa57jv812r4602iu43no8jm1h', 'userId').then(function (engine) {
  console.log(
    'Feature ' + splitio.isOn('userId', 'hello_world') ? 'enabled! :D' : 'disabled :|'
  );

  console.log(splitio);
}).catch(function (error) {
  console.log(error)
});
