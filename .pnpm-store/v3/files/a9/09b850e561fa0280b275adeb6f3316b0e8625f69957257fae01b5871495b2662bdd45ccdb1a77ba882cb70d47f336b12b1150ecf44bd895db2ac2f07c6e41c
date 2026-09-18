Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const index = require('../config/index.js');

function orchestrionTransformOptions(options) {
  return {
    instrumentations: [...index.SENTRY_INSTRUMENTATIONS, ...options.instrumentations || []],
    injectDiagnostics: (diag) => {
      return `(globalThis.__SENTRY_ORCHESTRION__=globalThis.__SENTRY_ORCHESTRION__||{}).bundler=${JSON.stringify(diag.transformedModules)};`;
    }
  };
}

exports.orchestrionTransformOptions = orchestrionTransformOptions;
//# sourceMappingURL=options.js.map
