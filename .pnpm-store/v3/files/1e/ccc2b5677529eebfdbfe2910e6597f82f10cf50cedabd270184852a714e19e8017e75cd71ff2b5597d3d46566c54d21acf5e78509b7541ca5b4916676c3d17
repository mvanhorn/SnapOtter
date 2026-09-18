import { SENTRY_INSTRUMENTATIONS } from '../config/index.js';

function orchestrionTransformOptions(options) {
  return {
    instrumentations: [...SENTRY_INSTRUMENTATIONS, ...options.instrumentations || []],
    injectDiagnostics: (diag) => {
      return `(globalThis.__SENTRY_ORCHESTRION__=globalThis.__SENTRY_ORCHESTRION__||{}).bundler=${JSON.stringify(diag.transformedModules)};`;
    }
  };
}

export { orchestrionTransformOptions };
//# sourceMappingURL=options.js.map
