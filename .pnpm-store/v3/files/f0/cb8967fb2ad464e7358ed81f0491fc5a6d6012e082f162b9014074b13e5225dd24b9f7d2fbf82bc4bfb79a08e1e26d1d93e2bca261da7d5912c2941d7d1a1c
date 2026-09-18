import type { InstrumentationConfig } from '@apm-js-collab/code-transformer';
/** Absolute path to the code-transform loader (a webpack loader; also usable as a Turbopack loader). */
export declare function getOrchestrionLoaderPath(): string;
/**
 * Absolute path to the `@apm-js-collab/tracing-hooks` package directory, resolved from this
 * package's own dependency graph. SDKs inject it at build time so the runtime module hook can
 * load the package even where the bare specifier doesn't resolve (bundled SDK code under
 * isolated installs, e.g. pnpm).
 */
export declare function getTracingHooksDirectory(): string;
/** The central instrumentation config, to pass as the loader's `instrumentations` option. */
export declare function getSentryInstrumentations(): InstrumentationConfig[];
/**
 * The code-transform webpack plugin, pre-fed the instrumentation config. Unlike the Vite plugin it
 * does NOT inject the `__SENTRY_ORCHESTRION__.bundler` marker — that would disable the runtime
 * module hook, which externalized packages still need (hybrid setup).
 */
export declare function sentryOrchestrionWebpackPlugin(): unknown;
//# sourceMappingURL=webpack.d.ts.map