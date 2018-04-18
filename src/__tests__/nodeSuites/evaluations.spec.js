import { SplitFactory } from '../../';

const SDK_INSTANCES_TO_TEST = 4;

export default async function(config, key, assert) {
  let i = 0, tested = 0;

  const getTreatmentTests = (client, sdkInstance) => {
    assert.comment(`Get Treatment Tests - Sdk Instance ${sdkInstance}`);
    assert.equal(client.getTreatment(key, 'whitelist'), 'allowed');
    assert.equal(client.getTreatment(key, 'qc_team'), 'no');

    assert.equal(client.getTreatment(key, 'user_attr_gte_10_and_user_attr2_is_not_foo'), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_gte_10_and_user_attr2_is_not_foo', {
      attr: 55,
      attr2: 'bar'
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_gte_10_and_user_attr2_is_not_foo', {
      attr: 55,
      attr2: 'foo'
    }), 'off');

    assert.equal(client.getTreatment(key, 'user_account_in_whitelist'), 'off');
    assert.equal(client.getTreatment(key, 'user_account_in_whitelist', {
      account: 'key_1@split.io'
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_account_in_whitelist', {
      account: 'key_6@split.io'
    }), 'off');

    assert.equal(client.getTreatment(key, 'user_account_in_segment_all'), 'off');
    assert.equal(client.getTreatment(key, 'user_account_in_segment_all', {
      account: 'something'
    }), 'on');

    assert.equal(client.getTreatment(key, 'user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: new Date('2016-03-17T18:55:47.021Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: new Date('2016-03-17T17:55:47.021Z').getTime()
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: new Date('2016-03-17T21:34:44.077Z').getTime()
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_btw_datetime_1458240947021_and_1458246884077'), 'off');

    assert.equal(client.getTreatment(key, 'user_attr_btw_number_10_and_20'), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_btw_number_10_and_20', {
      attr: 9
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_btw_number_10_and_20', {
      attr: 21
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_btw_number_10_and_20', {
      attr: 15
    }), 'on');

    assert.equal(client.getTreatment(key, 'user_attr_btw_10_and_20'), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_btw_10_and_20', {
      attr: 9
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_btw_10_and_20', {
      attr: 21
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_btw_10_and_20', {
      attr: 15
    }), 'on');

    assert.equal(client.getTreatment(key, 'user_attr_lte_datetime_1458240947021', {
      attr: new Date('2016-03-17T18:55:47.021Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_lte_datetime_1458240947021', {
      attr: new Date('2016-03-16T17:55:47.021Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_lte_datetime_1458240947021', {
      attr: new Date('2016-03-17T19:55:47.021Z').getTime()
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_lte_datetime_1458240947021'), 'off');

    assert.equal(client.getTreatment(key, 'user_attr_lte_number_10', {
      attr: 9
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_lte_number_10', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_lte_number_10', {
      attr: 11
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_lte_number_10'), 'off');

    assert.equal(client.getTreatment(key, 'user_attr_lte_10', {
      attr: 9
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_lte_10', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_lte_10', {
      attr: 11
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_lte_10'), 'off');

    assert.equal(client.getTreatment(key, 'user_attr_gte_datetime_1458240947021', {
      attr: new Date('2016-03-17T18:55:47.021Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_gte_datetime_1458240947021', {
      attr: new Date('2016-03-17T19:55:47.021Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_gte_datetime_1458240947021', {
      attr: new Date('2016-03-17T17:55:47.021Z').getTime()
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_gte_datetime_1458240947021'), 'off');

    assert.equal(client.getTreatment(key, 'user_attr_gte_number_10'), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_gte_number_10', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_gte_number_10', {
      attr: 11
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_gte_number_10', {
      attr: 0
    }), 'off');

    assert.equal(client.getTreatment(key, 'user_attr_gte_10'), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_gte_10', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_gte_10', {
      attr: 11
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_gte_10', {
      attr: 0
    }), 'off');

    assert.equal(client.getTreatment(key, 'user_attr_eq_datetime_1458240947021', {
      attr: new Date('2016-03-17T00:00:00Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_eq_datetime_1458240947021', {
      attr: new Date('2016-03-16T10:01:10Z').getTime()
    }), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_eq_datetime_1458240947021'), 'off');

    assert.equal(client.getTreatment(key, 'user_attr_eq_number_ten'), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_eq_number_ten', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_eq_number_ten', {
      attr: 9
    }), 'off');

    assert.equal(client.getTreatment(key, 'user_attr_eq_ten'), 'off');
    assert.equal(client.getTreatment(key, 'user_attr_eq_ten', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment(key, 'user_attr_eq_ten', {
      attr: 9
    }), 'off');

    // This split depends on Split hierarchical_dep_hierarchical which depends on a split that always retuns 'on'
    assert.equal(client.getTreatment(key, 'hierarchical_splits_test'), 'on');
  };

  const getTreatmentsTests = (client, sdkInstance) => {
    assert.comment(`Get Treatments Tests - Sdk Instance ${sdkInstance}`);
    
    assert.deepEqual(client.getTreatments(key, [
      // Treatments List
      'whitelist',
      'qc_team',
      'hierarchical_splits_test'
    ]), {
      // Expected result
      whitelist: 'allowed',
      qc_team: 'no',
      hierarchical_splits_test: 'on'
    });

    // I'm not sending the attributes
    assert.deepEqual(client.getTreatments(key, [
      'user_attr_gte_10_and_user_attr2_is_not_foo',
      'user_account_in_whitelist'
    ]), {
      user_attr_gte_10_and_user_attr2_is_not_foo: 'off',
      user_account_in_whitelist: 'off'
    });

    assert.deepEqual(client.getTreatments(key, [
      'user_attr_gte_10_and_user_attr2_is_not_foo',
      'user_account_in_whitelist'
    ], {
      // Attributes
      age: 20,
      attr: 55,
      attr2: 'bar',
      account: 'key@split.io'
    }), {
      user_attr_gte_10_and_user_attr2_is_not_foo: 'on',
      user_account_in_whitelist: 'off'
    });

    assert.deepEqual(client.getTreatments(key, [
      'user_attr_gte_10_and_user_attr2_is_not_foo',
      'user_account_in_whitelist'
    ], {
      // Attributes
      age: 21,
      attr: 55,
      attr2: 'foo',
      account: 'key_1@split.io'
    }), {
      user_attr_gte_10_and_user_attr2_is_not_foo: 'off',
      user_account_in_whitelist: 'on'
    });

  };

  for(i; i < SDK_INSTANCES_TO_TEST; i++) {
    let splitio = SplitFactory(config);

    let client = splitio.client();

    await client.ready();

    getTreatmentTests(client, i);
    getTreatmentsTests(client, i);

    await client.destroy();

    tested++;

    if (tested === SDK_INSTANCES_TO_TEST) {
      assert.end();
    }
  }
}
