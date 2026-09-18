import { type ZodType, z } from 'zod';
import type { AuthenticationConfiguration } from './authentication-configuration.js';
import { type SourceConfiguration } from './source-configuration.js';
import type { ApiReferenceLocalization } from './types.js';
/**
 * Standard configuration for the Api Reference.
 *
 * This is used internally to the configure the applications and does not include the sources.
 *
 * Sources should only be specified in the user facing configurations.
 *
 * In the the future it is likely sources will be removed completely from the configuration and instead
 * specified through a separate addDocument interface.
 */
export declare const apiReferenceConfigurationSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    authentication: z.ZodOptional<z.ZodAny>;
    baseServerURL: z.ZodOptional<z.ZodString>;
    hideClientButton: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    proxyUrl: z.ZodOptional<z.ZodString>;
    oauth2RedirectUri: z.ZodOptional<z.ZodString>;
    searchHotKey: z.ZodOptional<z.ZodEnum<{
        a: "a";
        b: "b";
        c: "c";
        d: "d";
        e: "e";
        f: "f";
        g: "g";
        h: "h";
        i: "i";
        j: "j";
        k: "k";
        l: "l";
        m: "m";
        n: "n";
        o: "o";
        p: "p";
        q: "q";
        r: "r";
        s: "s";
        t: "t";
        u: "u";
        v: "v";
        w: "w";
        x: "x";
        y: "y";
        z: "z";
    }>>;
    servers: z.ZodOptional<z.ZodArray<z.ZodAny>>;
    showSidebar: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    showDeveloperTools: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        never: "never";
        always: "always";
        localhost: "localhost";
    }>>>>;
    showToolbar: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        never: "never";
        always: "always";
        localhost: "localhost";
    }>>>>;
    operationTitleSource: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        summary: "summary";
        path: "path";
    }>>>>;
    theme: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        default: "default";
        alternate: "alternate";
        moon: "moon";
        purple: "purple";
        solarized: "solarized";
        bluePlanet: "bluePlanet";
        deepSpace: "deepSpace";
        saturn: "saturn";
        kepler: "kepler";
        elysiajs: "elysiajs";
        fastify: "fastify";
        mars: "mars";
        laserwave: "laserwave";
        none: "none";
    }>>>>;
    _integration: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        elysiajs: "elysiajs";
        fastify: "fastify";
        adonisjs: "adonisjs";
        astro: "astro";
        docusaurus: "docusaurus";
        dotnet: "dotnet";
        express: "express";
        fastapi: "fastapi";
        go: "go";
        hono: "hono";
        html: "html";
        laravel: "laravel";
        litestar: "litestar";
        nestjs: "nestjs";
        nextjs: "nextjs";
        nitro: "nitro";
        nuxt: "nuxt";
        platformatic: "platformatic";
        react: "react";
        rust: "rust";
        svelte: "svelte";
        vue: "vue";
    }>>>;
    onRequestSent: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodString], null>, z.ZodVoid>>;
    persistAuth: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    telemetry: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    externalUrls: z.ZodPrefault<z.ZodObject<{
        dashboardUrl: z.ZodPrefault<z.ZodString>;
        registryUrl: z.ZodPrefault<z.ZodString>;
        proxyUrl: z.ZodPrefault<z.ZodString>;
        apiBaseUrl: z.ZodPrefault<z.ZodString>;
    }, z.core.$strip>>;
    layout: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        modern: "modern";
        classic: "classic";
    }>>>>;
    proxy: z.ZodOptional<z.ZodString>;
    fetch: z.ZodOptional<z.ZodCustom<(input: string | URL | Request, init?: RequestInit) => Promise<Response>, (input: string | URL | Request, init?: RequestInit) => Promise<Response>>>;
    customFetch: z.ZodOptional<z.ZodCustom<(input: string | URL | Request, init?: RequestInit) => Promise<Response>, (input: string | URL | Request, init?: RequestInit) => Promise<Response>>>;
    plugins: z.ZodOptional<z.ZodArray<z.ZodFunction<z.ZodTuple<readonly [], null>, z.ZodObject<{
        name: z.ZodString;
        extensions: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            component: z.ZodUnknown;
            renderer: z.ZodOptional<z.ZodUnknown>;
        }, z.core.$strip>>;
        views: z.ZodOptional<z.ZodObject<{
            'content.start': z.ZodOptional<z.ZodArray<z.ZodObject<{
                component: z.ZodUnknown;
                renderer: z.ZodOptional<z.ZodUnknown>;
                props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                sidebar: z.ZodOptional<z.ZodObject<{
                    show: z.ZodDefault<z.ZodBoolean>;
                    label: z.ZodString;
                }, z.core.$strip>>;
            }, z.core.$strip>>>;
            'content.end': z.ZodOptional<z.ZodArray<z.ZodObject<{
                component: z.ZodUnknown;
                renderer: z.ZodOptional<z.ZodUnknown>;
                props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                sidebar: z.ZodOptional<z.ZodObject<{
                    show: z.ZodDefault<z.ZodBoolean>;
                    label: z.ZodString;
                }, z.core.$strip>>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
        hooks: z.ZodOptional<z.ZodObject<{
            onInit: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
                config: z.ZodObject<{
                    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                    authentication: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
                    baseServerURL: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                    hideClientButton: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>>;
                    proxyUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                    oauth2RedirectUri: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                    searchHotKey: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
                        a: "a";
                        b: "b";
                        c: "c";
                        d: "d";
                        e: "e";
                        f: "f";
                        g: "g";
                        h: "h";
                        i: "i";
                        j: "j";
                        k: "k";
                        l: "l";
                        m: "m";
                        n: "n";
                        o: "o";
                        p: "p";
                        q: "q";
                        r: "r";
                        s: "s";
                        t: "t";
                        u: "u";
                        v: "v";
                        w: "w";
                        x: "x";
                        y: "y";
                        z: "z";
                    }>>>;
                    servers: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny>>>;
                    showSidebar: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>>;
                    showDeveloperTools: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                        never: "never";
                        always: "always";
                        localhost: "localhost";
                    }>>>>>;
                    showToolbar: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                        never: "never";
                        always: "always";
                        localhost: "localhost";
                    }>>>>>;
                    operationTitleSource: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                        summary: "summary";
                        path: "path";
                    }>>>>>;
                    theme: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                        default: "default";
                        alternate: "alternate";
                        moon: "moon";
                        purple: "purple";
                        solarized: "solarized";
                        bluePlanet: "bluePlanet";
                        deepSpace: "deepSpace";
                        saturn: "saturn";
                        kepler: "kepler";
                        elysiajs: "elysiajs";
                        fastify: "fastify";
                        mars: "mars";
                        laserwave: "laserwave";
                        none: "none";
                    }>>>>>;
                    _integration: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<{
                        elysiajs: "elysiajs";
                        fastify: "fastify";
                        adonisjs: "adonisjs";
                        astro: "astro";
                        docusaurus: "docusaurus";
                        dotnet: "dotnet";
                        express: "express";
                        fastapi: "fastapi";
                        go: "go";
                        hono: "hono";
                        html: "html";
                        laravel: "laravel";
                        litestar: "litestar";
                        nestjs: "nestjs";
                        nextjs: "nextjs";
                        nitro: "nitro";
                        nuxt: "nuxt";
                        platformatic: "platformatic";
                        react: "react";
                        rust: "rust";
                        svelte: "svelte";
                        vue: "vue";
                    }>>>>;
                    onRequestSent: z.ZodOptional<z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodString], null>, z.ZodVoid>>>;
                    persistAuth: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>>;
                    plugins: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodFunction<z.ZodTuple<readonly [], null>, z.ZodObject<{
                        name: z.ZodString;
                        views: z.ZodOptional<z.ZodObject<{
                            'request.section': z.ZodOptional<z.ZodArray<z.ZodObject<{
                                title: z.ZodOptional<z.ZodString>;
                                component: z.ZodUnknown;
                                props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                            }, z.core.$strip>>>;
                            'response.section': z.ZodOptional<z.ZodArray<z.ZodObject<{
                                title: z.ZodOptional<z.ZodString>;
                                component: z.ZodUnknown;
                                props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                            }, z.core.$strip>>>;
                        }, z.core.$strip>>;
                        hooks: z.ZodOptional<z.ZodObject<{
                            onBeforeRequest: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
                                request: z.ZodAny;
                            }, z.core.$strip>], null>, z.core.$ZodFunctionOut>>;
                            onResponseReceived: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
                                response: z.ZodCustom<Response, Response>;
                                operation: z.ZodRecord<z.ZodString, z.ZodAny>;
                            }, z.core.$strip>], null>, z.core.$ZodFunctionOut>>;
                        }, z.core.$strip>>;
                    }, z.core.$strip>>>>>;
                    telemetry: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
                    externalUrls: z.ZodOptional<z.ZodPrefault<z.ZodObject<{
                        dashboardUrl: z.ZodPrefault<z.ZodString>;
                        registryUrl: z.ZodPrefault<z.ZodString>;
                        proxyUrl: z.ZodPrefault<z.ZodString>;
                        apiBaseUrl: z.ZodPrefault<z.ZodString>;
                    }, z.core.$strip>>>;
                }, z.core.$strip>;
                auth: z.ZodCustom<import("./api-reference-plugin.js").PluginAuthState, import("./api-reference-plugin.js").PluginAuthState>;
            }, z.core.$strip>], null>, z.core.$ZodFunctionOut>>;
            onConfigChange: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
                config: z.ZodObject<{
                    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                    authentication: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
                    baseServerURL: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                    hideClientButton: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>>;
                    proxyUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                    oauth2RedirectUri: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                    searchHotKey: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
                        a: "a";
                        b: "b";
                        c: "c";
                        d: "d";
                        e: "e";
                        f: "f";
                        g: "g";
                        h: "h";
                        i: "i";
                        j: "j";
                        k: "k";
                        l: "l";
                        m: "m";
                        n: "n";
                        o: "o";
                        p: "p";
                        q: "q";
                        r: "r";
                        s: "s";
                        t: "t";
                        u: "u";
                        v: "v";
                        w: "w";
                        x: "x";
                        y: "y";
                        z: "z";
                    }>>>;
                    servers: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny>>>;
                    showSidebar: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>>;
                    showDeveloperTools: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                        never: "never";
                        always: "always";
                        localhost: "localhost";
                    }>>>>>;
                    showToolbar: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                        never: "never";
                        always: "always";
                        localhost: "localhost";
                    }>>>>>;
                    operationTitleSource: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                        summary: "summary";
                        path: "path";
                    }>>>>>;
                    theme: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                        default: "default";
                        alternate: "alternate";
                        moon: "moon";
                        purple: "purple";
                        solarized: "solarized";
                        bluePlanet: "bluePlanet";
                        deepSpace: "deepSpace";
                        saturn: "saturn";
                        kepler: "kepler";
                        elysiajs: "elysiajs";
                        fastify: "fastify";
                        mars: "mars";
                        laserwave: "laserwave";
                        none: "none";
                    }>>>>>;
                    _integration: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodEnum<{
                        elysiajs: "elysiajs";
                        fastify: "fastify";
                        adonisjs: "adonisjs";
                        astro: "astro";
                        docusaurus: "docusaurus";
                        dotnet: "dotnet";
                        express: "express";
                        fastapi: "fastapi";
                        go: "go";
                        hono: "hono";
                        html: "html";
                        laravel: "laravel";
                        litestar: "litestar";
                        nestjs: "nestjs";
                        nextjs: "nextjs";
                        nitro: "nitro";
                        nuxt: "nuxt";
                        platformatic: "platformatic";
                        react: "react";
                        rust: "rust";
                        svelte: "svelte";
                        vue: "vue";
                    }>>>>;
                    onRequestSent: z.ZodOptional<z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodString], null>, z.ZodVoid>>>;
                    persistAuth: z.ZodOptional<z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>>;
                    plugins: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodFunction<z.ZodTuple<readonly [], null>, z.ZodObject<{
                        name: z.ZodString;
                        views: z.ZodOptional<z.ZodObject<{
                            'request.section': z.ZodOptional<z.ZodArray<z.ZodObject<{
                                title: z.ZodOptional<z.ZodString>;
                                component: z.ZodUnknown;
                                props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                            }, z.core.$strip>>>;
                            'response.section': z.ZodOptional<z.ZodArray<z.ZodObject<{
                                title: z.ZodOptional<z.ZodString>;
                                component: z.ZodUnknown;
                                props: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                            }, z.core.$strip>>>;
                        }, z.core.$strip>>;
                        hooks: z.ZodOptional<z.ZodObject<{
                            onBeforeRequest: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
                                request: z.ZodAny;
                            }, z.core.$strip>], null>, z.core.$ZodFunctionOut>>;
                            onResponseReceived: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
                                response: z.ZodCustom<Response, Response>;
                                operation: z.ZodRecord<z.ZodString, z.ZodAny>;
                            }, z.core.$strip>], null>, z.core.$ZodFunctionOut>>;
                        }, z.core.$strip>>;
                    }, z.core.$strip>>>>>;
                    telemetry: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
                    externalUrls: z.ZodOptional<z.ZodPrefault<z.ZodObject<{
                        dashboardUrl: z.ZodPrefault<z.ZodString>;
                        registryUrl: z.ZodPrefault<z.ZodString>;
                        proxyUrl: z.ZodPrefault<z.ZodString>;
                        apiBaseUrl: z.ZodPrefault<z.ZodString>;
                    }, z.core.$strip>>>;
                }, z.core.$strip>;
                auth: z.ZodCustom<import("./api-reference-plugin.js").PluginAuthState, import("./api-reference-plugin.js").PluginAuthState>;
            }, z.core.$strip>], null>, z.core.$ZodFunctionOut>>;
            onDestroy: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [], null>, z.core.$ZodFunctionOut>>;
        }, z.core.$strip>>;
        apiClientPlugins: z.ZodOptional<z.ZodArray<z.ZodAny>>;
    }, z.core.$strip>>>>;
    isEditable: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    hideModels: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    modelsSectionLabel: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"Models">, z.ZodLiteral<"Schemas">, z.ZodString]>>>>;
    localization: ZodType<ApiReferenceLocalization | undefined, unknown, z.core.$ZodTypeInternals<ApiReferenceLocalization | undefined, unknown>>;
    documentDownloadType: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        none: "none";
        both: "both";
        yaml: "yaml";
        json: "json";
        direct: "direct";
    }>>>>;
    hideDownloadButton: z.ZodOptional<z.ZodBoolean>;
    hideTestRequestButton: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    hideSearch: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    showOperationId: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    darkMode: z.ZodOptional<z.ZodBoolean>;
    forceDarkModeState: z.ZodOptional<z.ZodEnum<{
        dark: "dark";
        light: "light";
    }>>;
    hideDarkModeToggle: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    metaData: z.ZodOptional<z.ZodAny>;
    favicon: z.ZodOptional<z.ZodString>;
    hiddenClients: z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodBoolean, z.ZodArray<z.ZodString>]>>, z.ZodArray<z.ZodString>, z.ZodLiteral<true>]>>;
    defaultHttpClient: z.ZodOptional<z.ZodObject<{
        targetKey: z.ZodCustom<"c" | "r" | "go" | "rust" | "http" | "clojure" | "csharp" | "dart" | "fsharp" | "java" | "js" | "kotlin" | "node" | "objc" | "ocaml" | "php" | "powershell" | "python" | "ruby" | "shell" | "swift", "c" | "r" | "go" | "rust" | "http" | "clojure" | "csharp" | "dart" | "fsharp" | "java" | "js" | "kotlin" | "node" | "objc" | "ocaml" | "php" | "powershell" | "python" | "ruby" | "shell" | "swift">;
        clientKey: z.ZodString;
    }, z.core.$strip>>;
    customCss: z.ZodOptional<z.ZodString>;
    onServerChange: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodString], null>, z.ZodVoid>>;
    onDocumentSelect: z.ZodType<(() => Promise<void> | void) | undefined>;
    onLoaded: z.ZodType<((slug: string) => Promise<void> | void) | undefined>;
    onBeforeRequest: z.ZodType<((a: {
        request: Request;
        requestBuilder: any;
        envVariables: Record<string, string>;
    }) => Promise<void> | void) | undefined>;
    onRequestBuilt: z.ZodType<((a: {
        request: Request;
        requestBuilder: any;
        envVariables: Record<string, string>;
    }) => Promise<void> | void) | undefined>;
    onShowMore: z.ZodType<((a: string) => Promise<void> | void) | undefined>;
    onSidebarClick: z.ZodType<((a: string) => Promise<void> | void) | undefined>;
    pathRouting: z.ZodOptional<z.ZodObject<{
        basePath: z.ZodString;
    }, z.core.$strip>>;
    mcp: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        disabled: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    generateHeadingSlug: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
        slug: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>], null>, z.ZodString>>;
    generateModelSlug: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
        name: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>], null>, z.ZodString>>;
    generateTagSlug: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
        name: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>], null>, z.ZodString>>;
    generateOperationSlug: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
        path: z.ZodString;
        operationId: z.ZodOptional<z.ZodString>;
        method: z.ZodString;
        summary: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>], null>, z.ZodString>>;
    generateWebhookSlug: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
        name: z.ZodString;
        method: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>], null>, z.ZodString>>;
    setPageTitle: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodObject<{
        title: z.ZodString;
        document: z.ZodObject<{
            title: z.ZodString;
            slug: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>], null>, z.ZodString>>;
    redirect: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodString], null>, z.ZodOptional<z.ZodNullable<z.ZodString>>>>;
    withDefaultFonts: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    defaultOpenFirstTag: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    defaultOpenAllTags: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    expandAllModelSections: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    expandAllResponses: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    expandAllSchemaProperties: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    tagsSorter: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"alpha">, z.ZodFunction<z.ZodTuple<readonly [z.ZodAny, z.ZodAny], null>, z.ZodNumber>]>>;
    operationsSorter: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"alpha">, z.ZodLiteral<"method">, z.ZodFunction<z.ZodTuple<readonly [z.ZodAny, z.ZodAny], null>, z.ZodNumber>]>>;
    orderSchemaPropertiesBy: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"alpha">, z.ZodLiteral<"preserve">]>>>>;
    orderRequiredPropertiesFirst: z.ZodCatch<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, z.core.$strip>;
/**
 * Pure configuration without the sources
 *
 * @deprecated Remove this once the types have been fully migrated
 */
export type ApiReferenceConfigurationRaw = Omit<z.infer<typeof apiReferenceConfigurationSchema>, // Remove deprecated attributes
// Remove deprecated attributes
'proxy' | 'spec' | 'authentication' | 'showToolbar'> & {
    authentication?: AuthenticationConfiguration;
};
/**
 * Configuration for the Scalar Api Reference integrations
 *
 * See the type `ApiReferenceConfigurationWithSource` or `AnyApiReferenceConfiguration`\
 * for the configuration that includes the sources for you OpenAPI documents
 */
export type ApiReferenceConfiguration = ApiReferenceConfigurationRaw & {
    /** @deprecated
     * This type now refers to the base configuration that does not include the sources.
     * Use the type `ApiReferenceConfigurationWithSource` instead.
     */
    url?: SourceConfiguration['url'];
    /** @deprecated
     * This type now refers to the base configuration that does not include the sources.
     * Use the type `ApiReferenceConfigurationWithSource` instead.
     */
    content?: SourceConfiguration['content'];
    /**
     * Fired before the outbound request is built and sent. Mutate the **request builder** so the eventual fetch call
     * reflects your changes (method, path, headers, body, and related fields).
     *
     * The `request` passed here is **not** the object sent over the wire; the actual request is rebuilt from the builder
     * afterwards. Use `onRequestBuilt` instead when you need the exact outgoing request (for example, to hash a
     * `multipart/form-data` body for request signing).
     *
     * **Experimental:** The builder matches {@link https://github.com/scalar/scalar/blob/main/packages/workspace-store/src/request-example/builder/request-factory.ts RequestFactory}
     * (`import type { RequestFactory } from '@scalar/workspace-store/request-example'`). That shape is still experimental and may change in minor releases.
     *
     * @param input - Hook argument from the integration layer.
     * @param input.request - **Deprecated** when treated as a fetch API `Request`. Prefer thinking of this value as the
     * mutable builder ({@link https://github.com/scalar/scalar/blob/main/packages/workspace-store/src/request-example/builder/request-factory.ts RequestFactory}).
     * Some call sites only pass this property.
     * @param input.requestBuilder - The same builder when exposed under this name; **prefer** mutating this when your integration provides it.
     * @returns void or a promise that resolves when the hook finishes
     * @example
     * ```ts
     * onBeforeRequest: ({ request: builder }) => {
     *   builder.headers.set('Authorization', 'Bearer <token>')
     * }
     * ```
     */
    onBeforeRequest?: (input: {
        request: Request;
        requestBuilder: any;
        envVariables: Record<string, string>;
    }) => void | Promise<void> | undefined;
    /**
     * Fired after the outbound fetch `Request` has been built, right before it is sent. The `request` is the exact
     * object handed to fetch: mutating its headers modifies the outgoing request, and hashing its body produces a
     * hash that matches what the server receives (useful for request signing — a rebuilt `multipart/form-data` body
     * would get a different boundary).
     *
     * Use `onBeforeRequest` instead when you need to mutate the request builder (method, path, query, body,
     * security); those mutations have no effect at this stage because the request is already built.
     *
     * **Experimental:** This API may change in minor releases.
     *
     * @param input - Hook argument from the integration layer.
     * @param input.request - The exact fetch API `Request` that will be sent. Mutate its headers to modify the outgoing request.
     * @param input.requestBuilder - The builder the request was built from, for inspection. Mutating it has no effect at this stage.
     * @param input.envVariables - Resolved environment variables for the active environment.
     * @returns void or a promise that resolves when the hook finishes
     * @example
     * ```ts
     * onRequestBuilt: async ({ request }) => {
     *   const bodyHash = await hash(await request.clone().arrayBuffer())
     *   request.headers.set('X-Body-Hash', bodyHash)
     * }
     * ```
     */
    onRequestBuilt?: (input: {
        request: Request;
        requestBuilder: any;
        envVariables: Record<string, string>;
    }) => void | Promise<void> | undefined;
};
/** Migrate the configuration through a transform */
/** Configuration for the Api Reference */
export declare const apiReferenceConfigurationWithSourceSchema: ZodType<Omit<ApiReferenceConfiguration, 'url' | 'content'> & SourceConfiguration>;
/**
 * User facing configuration that includes the document source configuration
 */
export type ApiReferenceConfigurationWithSource = Omit<z.infer<typeof apiReferenceConfigurationWithSourceSchema>, 'proxy' | 'spec' | 'authentication' | 'showToolbar'> & {
    authentication?: AuthenticationConfiguration;
};
/**
 * Configuration for a single config with multiple sources
 * The configuration will be shared between the documents
 */
export type ApiReferenceConfigurationWithMultipleSources = ApiReferenceConfigurationWithSource & {
    sources: SourceConfiguration[];
};
/** Configuration for multiple Api References */
export type AnyApiReferenceConfiguration = Partial<ApiReferenceConfigurationWithSource> | Partial<ApiReferenceConfigurationWithMultipleSources> | Partial<ApiReferenceConfigurationWithSource>[] | Partial<ApiReferenceConfigurationWithMultipleSources>[];
//# sourceMappingURL=api-reference-configuration.d.ts.map