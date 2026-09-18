import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { SENTRY_INSTRUMENTATIONS } from '../config/index.js';

function getOrchestrionRequire() {
  let nodeRequire;
  nodeRequire = createRequire(import.meta.url);
  return nodeRequire;
}
function getOrchestrionLoaderPath() {
  return getOrchestrionRequire().resolve("@apm-js-collab/code-transformer-bundler-plugins/webpack-loader");
}
function getTracingHooksDirectory() {
  const packageJsonPath = getOrchestrionRequire().resolve("@apm-js-collab/tracing-hooks/package.json");
  return dirname(packageJsonPath).replace(/\\/g, "/");
}
function getSentryInstrumentations() {
  return SENTRY_INSTRUMENTATIONS;
}
function sentryOrchestrionWebpackPlugin() {
  const mod = getOrchestrionRequire()("@apm-js-collab/code-transformer-bundler-plugins/webpack");
  const codeTransformerWebpack = mod.default ?? mod;
  return codeTransformerWebpack({ instrumentations: SENTRY_INSTRUMENTATIONS });
}

export { getOrchestrionLoaderPath, getSentryInstrumentations, getTracingHooksDirectory, sentryOrchestrionWebpackPlugin };
//# sourceMappingURL=webpack.js.map
