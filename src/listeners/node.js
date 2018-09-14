// Until we migrate to TypeScript or revise our babel settings, we'll keep stuff here that should
// either be static methods or private/protected ones.
const SignalsToListen = [
  'SIGINT',
  'SIGHUP',
  'SIGQUIT',
  'SIGTERM',
  'uncaughtException',
  'exit'
];

function registerHandlers(handler) {
  SignalsToListen.forEach(signal => process.once(signal, handler));
}

function deregisterHandlers(handler) {
  SignalsToListen.forEach(signal => process.removeListener(signal, handler));
}

export default class NodeSignalListener {
  start(handler) {
    this.handler = handler;

    registerHandlers(this.handler);
  }

  stop() {
    deregisterHandlers(this.handler);
  }
}

