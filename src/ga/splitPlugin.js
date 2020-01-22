/**
 * Constructor for the SplitPlugin plugin.
 */
class SplitPlugin {

  constructor(tracker, config) {
    this.tracker = tracker;
    this.client = config.client;
    tracker.set('customTask', function (model) {
      console.log('customTask: '+ model.get('hitType'));
      const fields = ['hitType', 'trackingId', 'name', 'userId', 'clientId', 'screenResolution', 'queueTime', 'pageview', 'page'];
      const attributes = {};
      fields.forEach(field => {
        var fieldValue = model.get(field);
        console.log(field + ': ' + fieldValue);
        attributes[field] = fieldValue;
      });
      console.log(this.client.track('GA-splitPlugin', 1, attributes));
    });
  }

  /**
   * Change config.
   */
  setConfig(config) {
    this.config = config;
    console.log('setConfig');
    console.log(config);
  }

}

export default SplitPlugin;
