Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const codeTransformer = require('@apm-js-collab/code-transformer-bundler-plugins/vite');
const index = require('../config/index.js');
const options = require('./options.js');

function sentryOrchestrionPlugin(options$1 = {}) {
  return {
    ...codeTransformer.default(options.orchestrionTransformOptions(options$1)),
    config() {
      return { ssr: { noExternal: index.instrumentedModuleNames(options$1.instrumentations) } };
    }
  };
}

exports.sentryOrchestrionPlugin = sentryOrchestrionPlugin;
//# sourceMappingURL=vite.js.map
