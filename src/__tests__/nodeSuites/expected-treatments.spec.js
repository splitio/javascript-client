import { SplitFactory } from '../../';
import fs from 'fs';
import rl from 'readline';
import { url } from '../testUtils';

import splitChangesMockReal from '../mocks/splitchanges.real.json';

export default async function (config, settings, fetchMock, assert) {
  fetchMock.getOnce({ url: url(settings, '/splitChanges?s=1.3&since=-1&rbSince=-1'), overwriteRoutes: true }, { status: 200, body: splitChangesMockReal });
  fetchMock.get(url(settings, '/splitChanges?s=1.3&since=1457552620999&rbSince=-1'), { status: 200, body: { ff: { d: [], s: 1457552620999, t: 1457552620999 } } });

  const splitio = SplitFactory({
    ...config,
    scheduler: {
      ...config.scheduler,
      // This test generates more than 30000 impressions (the default impressionsQueueSize)
      // so we set the queue size unlimited, to avoid flushing impressions
      impressionsQueueSize: 0
    }
  });
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
