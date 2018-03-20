import tape from 'tape-catch';
import RedisServer from 'redis-server';
import { exec } from 'child_process';
import { SplitFactory } from '../';

const redisPort = '6385';

const config = {
  core: {
    authorizationKey: 'uoj4sb69bjv7d4d027f7ukkitd53ek6a9ai9'
  },
  urls: {
    sdk: 'https://sdk-aws-staging.split.io/api',
    events: 'https://events-aws-staging.split.io/api'
  },
  mode: 'consumer',
  storage: {
    type: 'REDIS',
    prefix: 'REDIS_NODE_UT',
    options: {
      url: `redis://localhost:${redisPort}/0`
    }
  }
};

/**
 * Initialize redis server and run a cli bash command to load redis with data to do the proper tests/
 */
const initializeRedisServer = () => {
  // Simply pass the port that you want a Redis server to listen on.  
  const server = new RedisServer(redisPort);

  const promise = new Promise((resolve, reject) => {
    server
      .open()
      .then(() => {
        exec(`cat ./src/__tests__/mocks/redis_mock.json | ./node_modules/redis-dump/bin/cli/redis-dump -p ${redisPort} --convert | redis-cli -p ${redisPort}` , (err, stdout, stderr) => {
          if (err) {
            reject(server);
            // node couldn't execute the command
            return;
          }

          resolve(server);
        });      
      });
  });

  return promise;
}

tape('NodeJS Redis', function (assert) {
  
  initializeRedisServer()
    .then(async (server) => {      
      const sdk = SplitFactory(config);
      const client = sdk.client();
      
      assert.equal(await client.getTreatment('UT_Segment_member', 'UT_IN_SEGMENT'), 'on');
      assert.equal(await client.getTreatment('other', 'UT_IN_SEGMENT'), 'off');

      assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_IN_SEGMENT'), 'off');
      assert.equal(await client.getTreatment('other', 'UT_NOT_IN_SEGMENT'), 'on');

      assert.equal(await client.getTreatment('UT_Segment_member', 'UT_SET_MATCHER', {
        permissions: ['admin']
      }), 'on');
      assert.equal(await client.getTreatment('UT_Segment_member', 'UT_SET_MATCHER', {
        permissions: ['not_matching']
      }), 'off');

      assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
        permissions: ['create']
      }), 'off');
      assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
        permissions: ['not_matching']
      }), 'on');

      assert.equal(await client.getTreatment('UT_Segment_member', 'always-on'), 'on');

      // Below splits were added manually to the redis_mock.json file.
      // They are all_keys (always evaluate to on) which depend from always-on split. the _on/off is what treatment they are expecting there.
      assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_on'), 'on');
      assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_off'), 'off');
      assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_on_negated'), 'off');

      client.destroy();

      // close server connection
      server.close().then(assert.end);
    });
});

tape('NodeJS Redis / Connection Error', async function (assert) {
  initializeRedisServer()
    .then(async (server) => {
      const sdk = SplitFactory(config);
      const client = sdk.client();

      assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
        permissions: ['create']
      }), 'off');
      assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
        permissions: ['not_matching']
      }), 'on');
      assert.equal(await client.getTreatment('UT_Segment_member', 'always-on'), 'on');

      // close server connection      
      server.close().then(() => {
        // we need to add a delay before doing a getTreatment
        const id = setTimeout(async () => {
          assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
            permissions: ['create']
          }), 'control');
          assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
            permissions: ['not_matching']
          }), 'control');
          assert.equal(await client.getTreatment('UT_Segment_member', 'always-on'), 'control');
          
          clearTimeout(id);

          client.destroy();

          assert.end();
        }, 1000);
      });      
    });
});