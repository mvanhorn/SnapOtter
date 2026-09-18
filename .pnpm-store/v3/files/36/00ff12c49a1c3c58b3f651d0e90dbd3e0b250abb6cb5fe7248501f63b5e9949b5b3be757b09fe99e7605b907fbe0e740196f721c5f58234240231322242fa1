import { amqplibChannelIntegration } from '../integrations/tracing-channel/amqplib';
import { anthropicChannelIntegration } from '../integrations/tracing-channel/anthropic';
import { dataloaderChannelIntegration } from '../integrations/tracing-channel/dataloader';
import { genericPoolChannelIntegration } from '../integrations/tracing-channel/generic-pool';
import { googleGenAIChannelIntegration } from '../integrations/tracing-channel/google-genai';
import { graphqlChannelIntegration } from '../integrations/tracing-channel/graphql';
import { hapiChannelIntegration } from '../integrations/tracing-channel/hapi';
import { ioredisChannelIntegration } from '../integrations/tracing-channel/ioredis';
import { kafkajsChannelIntegration } from '../integrations/tracing-channel/kafkajs';
import { knexChannelIntegration } from '../integrations/tracing-channel/knex';
import { lruMemoizerChannelIntegration } from '../integrations/tracing-channel/lru-memoizer';
import { mysqlChannelIntegration } from '../integrations/tracing-channel/mysql';
import { mysql2ChannelIntegration } from '../integrations/tracing-channel/mysql2';
import { openaiChannelIntegration } from '../integrations/tracing-channel/openai';
import { postgresChannelIntegration } from '../integrations/tracing-channel/postgres';
import { postgresJsChannelIntegration } from '../integrations/tracing-channel/postgres-js';
import { vercelAiChannelIntegration } from '../integrations/tracing-channel/vercel-ai';
import { expressChannelIntegration } from '../integrations/tracing-channel/express';
export { detectOrchestrionSetup, isOrchestrionInjected } from './detect';
export { nestjsChannels } from './config/nestjs';
export { amqplibChannelIntegration, anthropicChannelIntegration, dataloaderChannelIntegration, genericPoolChannelIntegration, googleGenAIChannelIntegration, graphqlChannelIntegration, hapiChannelIntegration, ioredisChannelIntegration, kafkajsChannelIntegration, knexChannelIntegration, lruMemoizerChannelIntegration, mysqlChannelIntegration, mysql2ChannelIntegration, openaiChannelIntegration, postgresChannelIntegration, postgresJsChannelIntegration, vercelAiChannelIntegration, expressChannelIntegration, };
export type { IORedisChannelIntegrationOptions, IORedisResponseHook } from '../integrations/tracing-channel/ioredis';
export type { PostgresJsChannelIntegrationOptions } from '../integrations/tracing-channel/postgres-js';
export { redisChannelIntegration } from '../integrations/tracing-channel/redis';
export type { RedisChannelIntegrationOptions, RedisResponseHook } from '../integrations/tracing-channel/redis';
export type * from '../integrations/tracing-channel/graphql/graphql-types';
/**
 * The canonical set of orchestrion diagnostics-channel integrations, keyed by their public
 * (OTel-parity) factory name.
 *
 * Single source of truth: add a new channel integration here and every consumer — the `@sentry/node`
 * opt-in helper (`experimentalUseDiagnosticsChannelInjection`) and its public
 * `diagnosticsChannelInjectionIntegrations()` map — picks it up automatically, so there's no separate
 * list to keep in sync.
 *
 * NOTE: `ioredisChannelIntegration` and `redisChannelIntegration` are intentionally NOT here. They
 * only partially replace the composite OTel `Redis` integration and need the node SDK's redis cache
 * `responseHook` (which can't live in `server-utils`), so `@sentry/node` wires them up separately.
 *
 * Framework SDKs that own their own channel listener (e.g. `@sentry/nestjs`'s `Nest`) are NOT here
 * either: their transform config is still in `SENTRY_INSTRUMENTATIONS`, but the listener lives in
 * their package and picks the channel-vs-OTel path itself at `setupOnce`, so it needs no central swap.
 *
 * NOTE: `dataloaderChannelIntegration` is also NOT here. Everything in this map is auto-appended to
 * the default integrations, but the OTel `Dataloader` integration is opt-in (never a default). Like
 * `@sentry/nestjs`'s `Nest`, its `@sentry/node` factory picks the channel-vs-OTel path itself at
 * `setupOnce` (via `isOrchestrionInjected()`), so there's nothing for the central swap to do.
 */
export declare const channelIntegrations: {
    readonly postgresIntegration: (options?: {
        ignoreConnectSpans?: boolean;
    } | undefined) => import("@sentry/core").Integration & {
        name: "Postgres";
    };
    readonly postgresJsIntegration: (options?: import(".").PostgresJsChannelIntegrationOptions | undefined) => import("@sentry/core").Integration & {
        name: "PostgresJs";
    };
    readonly mysqlIntegration: () => import("@sentry/core").Integration & {
        name: "Mysql";
    };
    readonly mysql2Integration: () => import("@sentry/core").Integration & {
        name: "Mysql2";
    };
    readonly genericPoolIntegration: () => import("@sentry/core").Integration & {
        name: "GenericPool";
    };
    readonly lruMemoizerIntegration: () => import("@sentry/core").Integration & {
        name: "LruMemoizer";
    };
    readonly openaiIntegration: (options?: import("@sentry/core").OpenAiOptions | undefined) => import("@sentry/core").Integration & {
        name: "OpenAI";
    };
    readonly anthropicIntegration: (options?: import("@sentry/core").AnthropicAiOptions | undefined) => import("@sentry/core").Integration & {
        name: "Anthropic_AI";
    };
    readonly googleGenAIIntegration: (options?: import("@sentry/core").GoogleGenAIOptions | undefined) => import("@sentry/core").Integration & {
        name: "Google_GenAI";
    };
    readonly vercelAiIntegration: (options?: {
        recordInputs?: boolean;
        recordOutputs?: boolean;
        enableTruncation?: boolean;
    } | undefined) => import("@sentry/core").Integration & {
        name: "VercelAI";
    };
    readonly amqplibIntegration: () => import("@sentry/core").Integration & {
        name: "Amqplib";
    };
    readonly hapiIntegration: () => import("@sentry/core").Integration & {
        name: "Hapi";
    };
    readonly expressIntegration: (options?: import("../integrations/tracing-channel/express/types").ExpressIntegrationOptions | undefined) => import("@sentry/core").Integration & {
        name: "Express";
    };
    readonly graphqlIntegration: (options?: import("../graphql/graphql-dc-subscriber").GraphqlDiagnosticChannelsOptions) => Omit<import("@sentry/core").Integration & {
        name: "Graphql";
    }, "name" | "setupOnce"> & {
        name: "Graphql";
        setupOnce: () => void | undefined;
    };
    readonly kafkajsIntegration: () => import("@sentry/core").Integration & {
        name: "Kafka";
    };
};
//# sourceMappingURL=index.d.ts.map