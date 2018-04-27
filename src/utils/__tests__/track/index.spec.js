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
import tape from 'tape';
import validate from '../../track/validate';

tape('TRACK VALIDATE / if valid arguments are passed should return true', assert => {
  const key = 'some_key';
  const eventTypeId = 'event_type';
  const trafficTypeName = 'traffic_type';
  const value = 10;

  const areValidTrackArguments = validate(key, trafficTypeName, eventTypeId, value);

  assert.true(areValidTrackArguments, 'track validate will return true if all params are valids');
  
  assert.end();
});

tape('TRACK VALIDATE / if valid arguments are passed should return true either value is undefined', assert => {
  const key = 'some_key';
  const eventTypeId = 'event_type';
  const trafficTypeName = 'traffic_type';

  const areValidTrackArguments = validate(key, trafficTypeName, eventTypeId);

  assert.true(areValidTrackArguments, 'track validate will return true if all params are valids');
  
  assert.end();
});

tape('TRACK VALIDATE / if a invalid key is passed should return false', assert => {
  const key = null;
  const eventTypeId = 'event_type';
  const trafficTypeName = 'traffic_type';
  const value = 10;

  const areValidTrackArguments = validate(key, trafficTypeName, eventTypeId, value);

  assert.notOk(areValidTrackArguments, 'track validate will return false if any param is invalid');
  
  assert.end();
});

tape('TRACK VALIDATE / if a invalid trafficTypeName is passed should return false', assert => {
  const key = 'some_key';
  const eventTypeId = 'event_type';
  const trafficTypeName = null;
  const value = 10;

  const areValidTrackArguments = validate(key, trafficTypeName, eventTypeId, value);

  assert.notOk(areValidTrackArguments, 'track validate will return false if any param is invalid');
  
  assert.end();
});

tape('TRACK VALIDATE / if a invalid trafficTypeName is passed should return false', assert => {
  const key = 'some_key';
  const eventTypeId = null;
  const trafficTypeName = 'traffic_type';
  const value = 10;

  const areValidTrackArguments = validate(key, trafficTypeName, eventTypeId, value);

  assert.notOk(areValidTrackArguments, 'track validate will return false if any param is invalid');
  
  assert.end();
});

tape('TRACK VALIDATE / if a invalid value is passed should return false', assert => {
  const key = 'some_key';
  const eventTypeId = 'event_type';
  const trafficTypeName = 'traffic_type';
  const value = 'invalid value';

  const areValidTrackArguments = validate(key, trafficTypeName, eventTypeId, value);

  assert.notOk(areValidTrackArguments, 'track validate will return false if any param is invalid');
  
  assert.end();
});

tape('TRACK VALIDATE / if value is null should return null', assert => {
  const key = 'some_key';
  const eventTypeId = 'event_type';
  const trafficTypeName = 'traffic_type';
  const value = null;

  const areValidTrackArguments = validate(key, trafficTypeName, eventTypeId, value);

  assert.ok(areValidTrackArguments, 'track validate will return true with value equal to null');
  
  assert.end();
});

