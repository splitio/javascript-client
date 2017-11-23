const SplitFactory = require('../../');

const SDK_INSTANCES_TO_TEST = 4;

module.exports = function(config, assert) {
  let i = 0, tested = 0;
  const wBucketing = !!config.core.key.bucketingKey;

  const getTreatmentTests = client => {
    assert.equal(client.getTreatment('blacklist'), 'not_allowed');
    assert.equal(client.getTreatment('whitelist'), 'allowed');
    assert.equal(client.getTreatment('splitters'), 'on');
    assert.equal(client.getTreatment('qc_team'), 'no');
    // If we are with the bucketing key, we should get a different treatment.
    assert.equal(client.getTreatment('user_account_in_segment_all_50_50'), wBucketing ? 'lower' : 'higher');
    assert.equal(client.getTreatment('user_account_in_segment_all_50_50_2'), wBucketing ? 'higher' : 'lower');

    assert.equal(client.getTreatment('employees_between_21_and_50_and_chrome'), 'off');
    assert.equal(client.getTreatment('employees_between_21_and_50_and_chrome', {
      age: 21
    }), 'off');
    assert.equal(client.getTreatment('employees_between_21_and_50_and_chrome', {
      age: 20,
      agent: 'chrome'
    }), 'off');
    assert.equal(client.getTreatment('employees_between_21_and_50_and_chrome', {
      age: 21,
      agent: 'chrome'
    }), 'on');

    assert.equal(client.getTreatment('user_attr_gte_10_and_user_attr2_is_not_foo'), 'off');
    assert.equal(client.getTreatment('user_attr_gte_10_and_user_attr2_is_not_foo', {
      attr: 55,
      attr2: 'bar'
    }), 'on');
    assert.equal(client.getTreatment('user_attr_gte_10_and_user_attr2_is_not_foo', {
      attr: 55,
      attr2: 'foo'
    }), 'off');

    assert.equal(client.getTreatment('user_account_in_whitelist'), 'off');
    assert.equal(client.getTreatment('user_account_in_whitelist', {
      account: 'key_1@split.io'
    }), 'on');
    assert.equal(client.getTreatment('user_account_in_whitelist', {
      account: 'key_6@split.io'
    }), 'off');

    // This is an special case for the browser.
    assert.equal(client.getTreatment('user_account_in_segment_employees'), 'off');
    assert.equal(client.getTreatment('user_account_in_segment_employees', {
      account: 'key_1@split.io'
    }), 'off');

    assert.equal(client.getTreatment('user_account_in_segment_all'), 'off');
    assert.equal(client.getTreatment('user_account_in_segment_all', {
      account: 'something'
    }), 'on');

    assert.equal(client.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: new Date('2016-03-17T18:55:47.021Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: new Date('2016-03-17T17:55:47.021Z').getTime()
    }), 'off');
    assert.equal(client.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077', {
      attr: new Date('2016-03-17T21:34:44.077Z').getTime()
    }), 'off');
    assert.equal(client.getTreatment('user_attr_btw_datetime_1458240947021_and_1458246884077'), 'off');

    assert.equal(client.getTreatment('user_attr_btw_number_10_and_20'), 'off');
    assert.equal(client.getTreatment('user_attr_btw_number_10_and_20', {
      attr: 9
    }), 'off');
    assert.equal(client.getTreatment('user_attr_btw_number_10_and_20', {
      attr: 21
    }), 'off');
    assert.equal(client.getTreatment('user_attr_btw_number_10_and_20', {
      attr: 15
    }), 'on');

    assert.equal(client.getTreatment('user_attr_btw_10_and_20'), 'off');
    assert.equal(client.getTreatment('user_attr_btw_10_and_20', {
      attr: 9
    }), 'off');
    assert.equal(client.getTreatment('user_attr_btw_10_and_20', {
      attr: 21
    }), 'off');
    assert.equal(client.getTreatment('user_attr_btw_10_and_20', {
      attr: 15
    }), 'on');

    assert.equal(client.getTreatment('user_attr_lte_datetime_1458240947021', {
      attr: new Date('2016-03-17T18:55:47.021Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment('user_attr_lte_datetime_1458240947021', {
      attr: new Date('2016-03-16T17:55:47.021Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment('user_attr_lte_datetime_1458240947021', {
      attr: new Date('2016-03-17T19:55:47.021Z').getTime()
    }), 'off');
    assert.equal(client.getTreatment('user_attr_lte_datetime_1458240947021'), 'off');

    assert.equal(client.getTreatment('user_attr_lte_number_10', {
      attr: 9
    }), 'on');
    assert.equal(client.getTreatment('user_attr_lte_number_10', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment('user_attr_lte_number_10', {
      attr: 11
    }), 'off');
    assert.equal(client.getTreatment('user_attr_lte_number_10'), 'off');

    assert.equal(client.getTreatment('user_attr_lte_10', {
      attr: 9
    }), 'on');
    assert.equal(client.getTreatment('user_attr_lte_10', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment('user_attr_lte_10', {
      attr: 11
    }), 'off');
    assert.equal(client.getTreatment('user_attr_lte_10'), 'off');

    assert.equal(client.getTreatment('user_attr_gte_datetime_1458240947021', {
      attr: new Date('2016-03-17T18:55:47.021Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment('user_attr_gte_datetime_1458240947021', {
      attr: new Date('2016-03-17T19:55:47.021Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment('user_attr_gte_datetime_1458240947021', {
      attr: new Date('2016-03-17T17:55:47.021Z').getTime()
    }), 'off');
    assert.equal(client.getTreatment('user_attr_gte_datetime_1458240947021'), 'off');

    assert.equal(client.getTreatment('user_attr_gte_number_10'), 'off');
    assert.equal(client.getTreatment('user_attr_gte_number_10', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment('user_attr_gte_number_10', {
      attr: 11
    }), 'on');
    assert.equal(client.getTreatment('user_attr_gte_number_10', {
      attr: 0
    }), 'off');

    assert.equal(client.getTreatment('user_attr_gte_10'), 'off');
    assert.equal(client.getTreatment('user_attr_gte_10', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment('user_attr_gte_10', {
      attr: 11
    }), 'on');
    assert.equal(client.getTreatment('user_attr_gte_10', {
      attr: 0
    }), 'off');

    assert.equal(client.getTreatment('user_attr_eq_datetime_1458240947021', {
      attr: new Date('2016-03-17T00:00:00Z').getTime()
    }), 'on');
    assert.equal(client.getTreatment('user_attr_eq_datetime_1458240947021', {
      attr: new Date('2016-03-16T10:01:10Z').getTime()
    }), 'off');
    assert.equal(client.getTreatment('user_attr_eq_datetime_1458240947021'), 'off');

    assert.equal(client.getTreatment('user_attr_eq_number_ten'), 'off');
    assert.equal(client.getTreatment('user_attr_eq_number_ten', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment('user_attr_eq_number_ten', {
      attr: 9
    }), 'off');

    assert.equal(client.getTreatment('user_attr_eq_ten'), 'off');
    assert.equal(client.getTreatment('user_attr_eq_ten', {
      attr: 10
    }), 'on');
    assert.equal(client.getTreatment('user_attr_eq_ten', {
      attr: 9
    }), 'off');

    // This split depends on Split hierarchical_dep_hierarchical which depends on a split that always retuns 'on'
    assert.equal(client.getTreatment('hierarchical_splits_test'), 'on');
  };

  const getTreatmentsTests = client => {
    assert.deepEqual(client.getTreatments([
      // Treatments List
      'blacklist',
      'whitelist',
      'splitters',
      'qc_team',
      'hierarchical_splits_test'
    ]), {
      // Expected result
      blacklist: 'not_allowed',
      whitelist: 'allowed',
      splitters: 'on',
      qc_team: 'no',
      hierarchical_splits_test: 'on'
    });

    // I'm not sending the attributes
    assert.deepEqual(client.getTreatments([
      'employees_between_21_and_50_and_chrome',
      'user_attr_gte_10_and_user_attr2_is_not_foo',
      'user_account_in_whitelist'
    ]), {
      employees_between_21_and_50_and_chrome: 'off',
      user_attr_gte_10_and_user_attr2_is_not_foo: 'off',
      user_account_in_whitelist: 'off'
    });

    assert.deepEqual(client.getTreatments([
      'employees_between_21_and_50_and_chrome',
      'user_attr_gte_10_and_user_attr2_is_not_foo',
      'user_account_in_whitelist'
    ], {
      // Attributes
      age: 20,
      agent: 'foo',
      attr: 55,
      attr2: 'bar',
      account: 'key@split.io'
    }), {
      employees_between_21_and_50_and_chrome: 'off',
      user_attr_gte_10_and_user_attr2_is_not_foo: 'on',
      user_account_in_whitelist: 'off'
    });

    assert.deepEqual(client.getTreatments([
      'employees_between_21_and_50_and_chrome',
      'user_attr_gte_10_and_user_attr2_is_not_foo',
      'user_account_in_whitelist'
    ], {
      // Attributes
      age: 21,
      agent: 'chrome',
      attr: 55,
      attr2: 'foo',
      account: 'key_1@split.io'
    }), {
      employees_between_21_and_50_and_chrome: 'on',
      user_attr_gte_10_and_user_attr2_is_not_foo: 'off',
      user_account_in_whitelist: 'on'
    });

  };

  for(i; i < SDK_INSTANCES_TO_TEST; i++) {
    let splitio = SplitFactory(config);

    let client = splitio.client();

    client.ready().then(() => {
      getTreatmentTests(client);
      getTreatmentsTests(client);
      client.destroy();
      tested++;

      if (tested === SDK_INSTANCES_TO_TEST) {
        assert.end();
      }
    });
  }
};
