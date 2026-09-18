Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

const amqplib = require('../integrations/tracing-channel/amqplib.js');
const anthropic = require('../integrations/tracing-channel/anthropic.js');
const dataloader = require('../integrations/tracing-channel/dataloader.js');
const genericPool = require('../integrations/tracing-channel/generic-pool.js');
const googleGenai = require('../integrations/tracing-channel/google-genai.js');
const index$1 = require('../integrations/tracing-channel/graphql/index.js');
const hapi = require('../integrations/tracing-channel/hapi.js');
const ioredis = require('../integrations/tracing-channel/ioredis.js');
const index$2 = require('../integrations/tracing-channel/kafkajs/index.js');
const knex = require('../integrations/tracing-channel/knex.js');
const lruMemoizer = require('../integrations/tracing-channel/lru-memoizer.js');
const mysql = require('../integrations/tracing-channel/mysql.js');
const mysql2 = require('../integrations/tracing-channel/mysql2.js');
const openai = require('../integrations/tracing-channel/openai.js');
const postgres = require('../integrations/tracing-channel/postgres.js');
const postgresJs = require('../integrations/tracing-channel/postgres-js.js');
const vercelAi = require('../integrations/tracing-channel/vercel-ai.js');
const index = require('../integrations/tracing-channel/express/index.js');
const detect = require('./detect.js');
const nestjs = require('./config/nestjs.js');
const redis = require('../integrations/tracing-channel/redis.js');

const channelIntegrations = {
  postgresIntegration: postgres.postgresChannelIntegration,
  postgresJsIntegration: postgresJs.postgresJsChannelIntegration,
  mysqlIntegration: mysql.mysqlChannelIntegration,
  mysql2Integration: mysql2.mysql2ChannelIntegration,
  genericPoolIntegration: genericPool.genericPoolChannelIntegration,
  lruMemoizerIntegration: lruMemoizer.lruMemoizerChannelIntegration,
  openaiIntegration: openai.openaiChannelIntegration,
  anthropicIntegration: anthropic.anthropicChannelIntegration,
  googleGenAIIntegration: googleGenai.googleGenAIChannelIntegration,
  vercelAiIntegration: vercelAi.vercelAiChannelIntegration,
  amqplibIntegration: amqplib.amqplibChannelIntegration,
  hapiIntegration: hapi.hapiChannelIntegration,
  expressIntegration: index.expressChannelIntegration,
  graphqlIntegration: index$1.graphqlDiagnosticsChannelIntegration,
  kafkajsIntegration: index$2.kafkajsChannelIntegration
};

exports.amqplibChannelIntegration = amqplib.amqplibChannelIntegration;
exports.anthropicChannelIntegration = anthropic.anthropicChannelIntegration;
exports.dataloaderChannelIntegration = dataloader.dataloaderChannelIntegration;
exports.genericPoolChannelIntegration = genericPool.genericPoolChannelIntegration;
exports.googleGenAIChannelIntegration = googleGenai.googleGenAIChannelIntegration;
exports.graphqlChannelIntegration = index$1.graphqlChannelIntegration;
exports.hapiChannelIntegration = hapi.hapiChannelIntegration;
exports.ioredisChannelIntegration = ioredis.ioredisChannelIntegration;
exports.kafkajsChannelIntegration = index$2.kafkajsChannelIntegration;
exports.knexChannelIntegration = knex.knexChannelIntegration;
exports.lruMemoizerChannelIntegration = lruMemoizer.lruMemoizerChannelIntegration;
exports.mysqlChannelIntegration = mysql.mysqlChannelIntegration;
exports.mysql2ChannelIntegration = mysql2.mysql2ChannelIntegration;
exports.openaiChannelIntegration = openai.openaiChannelIntegration;
exports.postgresChannelIntegration = postgres.postgresChannelIntegration;
exports.postgresJsChannelIntegration = postgresJs.postgresJsChannelIntegration;
exports.vercelAiChannelIntegration = vercelAi.vercelAiChannelIntegration;
exports.expressChannelIntegration = index.expressChannelIntegration;
exports.detectOrchestrionSetup = detect.detectOrchestrionSetup;
exports.isOrchestrionInjected = detect.isOrchestrionInjected;
exports.nestjsChannels = nestjs.nestjsChannels;
exports.redisChannelIntegration = redis.redisChannelIntegration;
exports.channelIntegrations = channelIntegrations;
//# sourceMappingURL=index.js.map
