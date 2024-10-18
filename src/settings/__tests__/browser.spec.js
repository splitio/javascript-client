import tape from 'tape-catch';
import { settingsFactory } from '../browser';

tape('SETTINGS / Consent is overwritable and "GRANTED" by default in client-side', assert => {
  let settings = settingsFactory({});
  assert.equal(settings.userConsent, 'GRANTED', 'userConsent defaults to granted if not provided.');

  settings = settingsFactory({ userConsent: 'INVALID-VALUE' });
  assert.equal(settings.userConsent, 'GRANTED', 'userConsent defaults to granted if a wrong value is provided.');

  settings = settingsFactory({ userConsent: 'UNKNOWN' });
  assert.equal(settings.userConsent, 'UNKNOWN', 'userConsent can be overwritten.');

  settings = settingsFactory({ userConsent: 'declined' });
  assert.equal(settings.userConsent, 'DECLINED', 'userConsent can be overwritten.');

  assert.end();
});
