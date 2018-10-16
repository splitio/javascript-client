export default function MetaBuilder(settings) {
  return {
    s: settings.version,
    i: settings.runtime.ip,
    n: settings.runtime.hostname
  };
}
