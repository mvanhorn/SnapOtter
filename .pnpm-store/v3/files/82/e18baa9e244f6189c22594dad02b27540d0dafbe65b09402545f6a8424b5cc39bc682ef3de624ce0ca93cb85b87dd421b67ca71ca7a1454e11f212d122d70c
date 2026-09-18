Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const Module = require('node:module');
const node_path = require('node:path');
const index = require('../config/index.js');

function getOrchestrionRequire() {
  let nodeRequire;
  nodeRequire = Module.createRequire(__filename);
  return nodeRequire;
}
function getOrchestrionLoaderPath() {
  return getOrchestrionRequire().resolve("@apm-js-collab/code-transformer-bundler-plugins/webpack-loader");
}
function getTracingHooksDirectory() {
  const packageJsonPath = getOrchestrionRequire().resolve("@apm-js-collab/tracing-hooks/package.json");
  return node_path.dirname(packageJsonPath).replace(/\\/g, "/");
}
function getSentryInstrumentations() {
  return index.SENTRY_INSTRUMENTATIONS;
}
function sentryOrchestrionWebpackPlugin() {
  const mod = getOrchestrionRequire()("@apm-js-collab/code-transformer-bundler-plugins/webpack");
  const codeTransformerWebpack = mod.default ?? mod;
  return codeTransformerWebpack({ instrumentations: index.SENTRY_INSTRUMENTATIONS });
}

exports.getOrchestrionLoaderPath = getOrchestrionLoaderPath;
exports.getSentryInstrumentations = getSentryInstrumentations;
exports.getTracingHooksDirectory = getTracingHooksDirectory;
exports.sentryOrchestrionWebpackPlugin = sentryOrchestrionWebpackPlugin;
//# sourceMappingURL=webpack.js.map
