// CHECK provide.js at autotrack
export default function providePlugin(pluginName, pluginConstructor) {
  var ga = window[window['GoogleAnalyticsObject'] || 'ga'];
  if (typeof ga == 'function') {
    ga('provide', pluginName, pluginConstructor);
  }
}