'use strict';

console.log('SPLIT DEMO!');

splitio.start('epa57jv812r4602iu43no8jm1h', 'userId').then(function() {
  console.log(
    'Feature ' + splitio.isOn('hello_world') ? 'enabled! :D' : 'disabled :|'
  );
}).catch(function(error) {
  console.log(error);
});
