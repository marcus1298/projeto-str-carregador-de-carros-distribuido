import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { OpensearchClient } from 'nestjs-opensearch';
import * as requestIp from 'request-ip';
import { WsOCPPAdapter } from './adapter/ocpp-ws-adapter';
import { AppModule } from './app.module';
import { HttpExceptionsFilter } from './exceptions/exceptions.filter';

import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const queryBus = app.get(QueryBus);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  const cache = app.get(CACHE_MANAGER);
  const opensearchClient = app.get(OpensearchClient);

  const { httpAdapter } = app.get(HttpAdapterHost);

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  app.use(Sentry.Handlers.errorHandler());
  app.use(helmet());
  app.use(requestIp.mw());

  app.useGlobalFilters(new HttpExceptionsFilter(cache, logger, httpAdapter));

  const wsPort = Number(process.env.WS_PORT ?? 3000);

  app.useWebSocketAdapter(new WsOCPPAdapter(cache, wsPort, logger, queryBus, opensearchClient));

  const httpPort = Number(process.env.HTTP_PORT ?? 3001);

  logger.log(`Starting HTTP server on port ${httpPort}.`);

  await app.listen(httpPort);
}
bootstrap();
