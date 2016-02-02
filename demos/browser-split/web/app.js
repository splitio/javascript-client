'use strict';

console.log('SPLIT DEMO!');

splitio.start('3ceer7iea9he3kp8tveje9u19a', 'userId').then(function (engine) {
  console.log(
    'Feature ' + splitio.isOn('userId', 'hello_world') ? 'enabled! :D' : 'disabled :|'
  );

  console.log(splitio);
}).catch(function (error) {
  console.log(error)
});
