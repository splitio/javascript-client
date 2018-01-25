/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
import tape from 'tape-catch';
import { zeroSinceHH, zeroSinceSS } from '../../convertions';

tape('CONVERTIONS / zero since HH should change the date in a way we only have dd-mm-yyyy since midnight in UTC', assert => {

  assert.equal(zeroSinceHH(1459881314917), 1459814400000, 'Tue Apr 05 2016');
  assert.equal(zeroSinceHH(1420113683000), 1420070400000, 'Thu Jan 01 2015');
  assert.end();

});

tape('CONVERTIONS / zero since SS should change the date in a way we only have dd mm yyyy hh mm since midnight in UTC', assert => {

  assert.equal(zeroSinceSS(1420110671000), 1420110660000, '01 Jan 2015 11:11:11 UT should be transformed to 01 Jan 2015 11:11:00 UT');
  assert.equal(zeroSinceSS(953683199000), 953683140000, '21 Mar 2000 23:59:59 UT should be transformed to 21 Mar 2000 23:59:00 UT');
  assert.end();

});