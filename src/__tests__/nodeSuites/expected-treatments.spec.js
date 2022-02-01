import { SplitFactory } from '../../';
import fs from 'fs';
import rl from 'readline';
import { url } from '../testUtils';

import splitChangesMockReal from '../mocks/splitchanges.real.json';

export default async function (config, settings, fetchMock, assert) {
  fetchMock.get({ url: url(settings, '/splitChanges?since=-1'), overwriteRoutes: true }, { status: 200, body: splitChangesMockReal });

  const splitio = SplitFactory(config);
  const client = splitio.client();

  await client.ready();

  let parser = rl.createInterface({
    terminal: false,
    input: fs.createReadStream(require.resolve('../mocks/expected-treatments.csv'))
  });

  parser
    .on('line', line => {
      const parts = line.toString('utf8').split(',');

      if (parts.length === 2) {
        const key = parts[0];
        const treatment = parts[1];

        assert.equal(client.getTreatment(key, 'real_split'), treatment, `Checking expected treatment "${treatment}" for key: ${key}`);
      }
    })
    .on('close', () => client.destroy().then(assert.end));
}
