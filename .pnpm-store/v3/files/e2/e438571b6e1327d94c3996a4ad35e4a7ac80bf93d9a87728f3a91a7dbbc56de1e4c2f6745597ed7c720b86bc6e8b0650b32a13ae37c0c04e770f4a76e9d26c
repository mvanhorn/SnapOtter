import type { AnyApiReferenceConfiguration, HtmlRenderingConfiguration } from '@scalar/types/api-reference';
export type { AnyApiReferenceConfiguration, HtmlRenderingConfiguration };
/** Default CDN URL for the @scalar/api-reference standalone bundle. */
export declare const DEFAULT_CDN = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";
/**
 * Render the Scalar API Reference as a complete HTML document using the CDN.
 *
 * Generates static HTML that loads the @scalar/api-reference standalone bundle
 * from a CDN and renders client-side. No server-side dependencies required.
 *
 * For server-side rendering with hydration, use the server module instead.
 */
export declare function renderApiReference(options: {
    /** The API reference configuration. */
    config: AnyApiReferenceConfiguration;
    /** Page title. Defaults to "Scalar API Reference". */
    pageTitle?: string;
    /** CDN URL for the standalone bundle. Defaults to jsDelivr. */
    cdn?: string;
    /**
     * A Content Security Policy (CSP) nonce to apply to the generated inline `<script>` and `<style>`
     * tags (and the CDN `<script>` tag).
     *
     * When set, a `<meta property="csp-nonce">` tag is also emitted so the standalone bundle can apply
     * the same nonce to the stylesheet it injects at runtime. This lets the API Reference run under a
     * strict `script-src` with no `unsafe-inline` and no `unsafe-eval`.
     *
     * Note: `style-src` still needs `'unsafe-inline'`, because the reference renders inline
     * `style="..."` attributes that a CSP nonce cannot authorize.
     */
    nonce?: string;
}, customTheme?: string): string;
/**
 * Serialize a configuration object to a JavaScript object literal string.
 *
 * Unlike `JSON.stringify`, this preserves function-valued properties (for example `onBeforeRequest`
 * or the request hooks) by emitting them as literal JavaScript source via `Function.prototype.toString()`.
 * That is what lets callbacks survive being written into an inline `<script>` tag, or across any other
 * boundary that would otherwise JSON-serialize the configuration and silently drop functions.
 *
 * Note: functions must be arrow functions or `function` expressions. Object method shorthand
 * (`onBeforeRequest(request) {}`) does not serialize to a valid standalone expression.
 */
export declare function serializeConfigToJs(configuration: Record<string, unknown>): string;
/**
 * The script tags to load the @scalar/api-reference package from the CDN.
 *
 * When a `nonce` is provided it is applied to both script tags so they are allowed under a strict
 * `script-src` Content Security Policy.
 */
export declare function getScriptTags(configuration: Record<string, unknown>, cdn?: string, nonce?: string): string;
/**
 * The configuration to pass to the @scalar/api-reference package.
 */
export declare const getConfiguration: (givenConfiguration: Partial<HtmlRenderingConfiguration> | Record<string, unknown>) => Record<string, unknown>;
//# sourceMappingURL=html-rendering.d.ts.map