Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const core = require('@sentry/core');
const Module = require('node:module');
const node_url = require('node:url');
const debugBuild = require('../../debug-build.js');
const index = require('../config/index.js');

function hasStableSyncModuleHooks(denoVersionString) {
  const parseVersion = (v) => v.split(".").map((n) => parseInt(n, 10));
  const nodeVersion = parseVersion(process.versions.node ?? "0.0.0");
  const denoVersion = parseVersion(denoVersionString ?? "0.0.0");
  return (nodeVersion[0] ?? 0) > 25 || nodeVersion[0] === 25 && (nodeVersion[1] ?? 0) >= 1 || nodeVersion[0] === 24 && (nodeVersion[1] ?? 0) >= 13 || (denoVersion[0] ?? 0) > 2 || denoVersion[0] === 2 && (denoVersion[1] ?? 0) >= 8;
}
function registerDiagnosticsChannelInjection(options) {
  if (core.GLOBAL_OBJ?.__SENTRY_ORCHESTRION__?.runtime) {
    return;
  }
  const globalAny = globalThis;
  const stableSyncHooks = hasStableSyncModuleHooks(globalAny.Deno?.version?.deno);
  let thisModuleUrl;
  thisModuleUrl = node_url.pathToFileURL(__filename).href;
  let nodeRequire;
  nodeRequire = require;
  const tracingHooksDir = options?.tracingHooksDir;
  const requireFromHooksDir = tracingHooksDir ? Module.createRequire(thisModuleUrl) : void 0;
  const mod = Module;
  try {
    if (typeof mod.registerHooks === "function" && stableSyncHooks) {
      const { initialize, resolve, load, setDiagnosticsHook } = requireFromHooksDir ? requireFromHooksDir(`${tracingHooksDir}/hook-sync.mjs`) : nodeRequire("@apm-js-collab/tracing-hooks/hook-sync.mjs");
      setDiagnosticsHook((event) => {
        core.GLOBAL_OBJ.__SENTRY_ORCHESTRION__ = core.GLOBAL_OBJ.__SENTRY_ORCHESTRION__ || {};
        core.GLOBAL_OBJ.__SENTRY_ORCHESTRION__.runtime = core.GLOBAL_OBJ.__SENTRY_ORCHESTRION__.runtime || [];
        core.GLOBAL_OBJ.__SENTRY_ORCHESTRION__.runtime.push(event.moduleName);
      });
      initialize({ instrumentations: index.SENTRY_INSTRUMENTATIONS });
      mod.registerHooks({ resolve, load });
      debugBuild.DEBUG_BUILD && core.debug.log("[orchestrion] registered diagnostics-channel injection via Module.registerHooks()");
    } else if (typeof mod.register === "function" && !globalAny.Bun && !globalAny.Deno) {
      const hookSpecifier = tracingHooksDir ? node_url.pathToFileURL(`${tracingHooksDir}/hook.mjs`).href : "@apm-js-collab/tracing-hooks/hook.mjs";
      mod.register(hookSpecifier, {
        parentURL: thisModuleUrl,
        data: { instrumentations: index.SENTRY_INSTRUMENTATIONS }
      });
      const ModulePatch = requireFromHooksDir && tracingHooksDir ? requireFromHooksDir(tracingHooksDir) : nodeRequire("@apm-js-collab/tracing-hooks");
      new ModulePatch({ instrumentations: index.SENTRY_INSTRUMENTATIONS }).patch();
      debugBuild.DEBUG_BUILD && core.debug.log("[orchestrion] registered diagnostics-channel injection via Module.register()");
    } else {
      debugBuild.DEBUG_BUILD && core.debug.warn("[Sentry] No available Node API to register diagnostics-channel injection hooks; skipping.");
      return;
    }
  } catch (error) {
    debugBuild.DEBUG_BUILD && core.debug.warn(
      "[Sentry] Failed to register diagnostics-channel injection hooks; channel-based integrations will not record spans.",
      error
    );
    return;
  }
  core.GLOBAL_OBJ.__SENTRY_ORCHESTRION__ = core.GLOBAL_OBJ.__SENTRY_ORCHESTRION__ || {};
  core.GLOBAL_OBJ.__SENTRY_ORCHESTRION__.runtime = core.GLOBAL_OBJ.__SENTRY_ORCHESTRION__.runtime || [];
}

exports.registerDiagnosticsChannelInjection = registerDiagnosticsChannelInjection;
//# sourceMappingURL=register.js.map
