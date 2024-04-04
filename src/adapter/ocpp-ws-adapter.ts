import { GetStationQuery } from '@/charger/queries/types/station.query';
import { ChargerStation } from '@/entities/charger-station.entity';
import { BLACKLIST_KEY } from '@/types/constants/blacklist';
import { ATTEMPTS_KEY, ATTEMPTS_TTL, MAX_ATTEMPTS } from '@/types/constants/rate-limit';
import { OCPPSocket } from '@/types/ocpp/socket';
import { Inject, LoggerService, WebSocketAdapter } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { MessageMappingProperties } from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { isArray } from 'class-validator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as RequestIp from 'request-ip';
import { Observable } from 'rxjs';
import * as WebSocket from 'ws';
import { bindCallHandler } from './handlers/ocpp-call-handler';
import { bindCallResultHandler } from './handlers/ocpp-call-result-handler';
import { OpensearchClient } from 'nestjs-opensearch';
import { GetZoneQueryHandler } from '@/charger/queries/handlers/zone-query.handler';
import { ChargerZone } from '@/entities/charger-zone.entity';
import { GetZoneQuery } from '@/charger/queries/types/zone.query';

function parseURLForId(url: string): string {
  const urlSplitPath = url.split('/');

  if (!urlSplitPath.length) {
    return null;
  }

  const stationId = urlSplitPath.splice(-1)[0];

  if (!stationId || stationId === '') {
    return null;
  }

  return stationId.replace(/[^a-zA-Z0-9]/g, '');
}

export class WsOCPPAdapter implements WebSocketAdapter {
  constructor(
    private cacheManager: Cache,
    private readonly wsPort: number,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private queryBus: QueryBus,
    private opensearchClient: OpensearchClient,
  ) {
  }

  create(port, options: any = {}): any {

    this.logger.log(`Starting Websocket Server on port ${this.wsPort}.`);

    return new WebSocket.Server({
      port: this.wsPort,
      ...options,
      perMessageDeflate: true,
      clientTracking: true,
    });
  }

  bindClientConnect(server, callback: Function) {
    server.on('connection', async (socket: OCPPSocket, req: any) => {
      const ip = RequestIp.getClientIp(req);

      const attempts = (await this.cacheManager.get<number>(`${ATTEMPTS_KEY}${ip}`)) ?? 0;

      await this.cacheManager.set(`${ATTEMPTS_KEY}${ip}`, (attempts + 1), ATTEMPTS_TTL);

      const blacklist = await this.cacheManager.get<string[]>(BLACKLIST_KEY) ?? [];

      if (blacklist.includes(ip)) {
        socket.close(3001, 'Unauthorized');
        return;
      }

      if (attempts > MAX_ATTEMPTS) {
        blacklist.push(ip);
        socket.close(3001, 'Unauthorized');
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host}`);

      const stationId = parseURLForId(url.pathname);

      if (!stationId?.length) {
        socket.close(3001, 'Unauthorized');
        return;
      }


      const station = await this.queryBus.execute<GetStationQuery, ChargerStation>(
        new GetStationQuery({ uid: stationId }),
      );

      const zone = await this.queryBus.execute<GetZoneQuery, ChargerZone>(new GetZoneQuery({ uid: station.zone.id }));

      if (!station) {
        socket.close(3001, 'Unauthorized');
        return;
      }

      await this.opensearchClient.index({
        id: `${station.id}-${Date.now()}`,
        index: 'starev-chargerstation',
        body: {
          stationId: station.id,
          ip,
          geolocation: zone.location,
          timestamp: new Date().toISOString(),
          event: 'ChargerStation-Connected'
        },
      });

      console.log(`Station connected: ${station.id}`);

      socket.station = station;

      socket.sendMessage = (message) => {
        if (isArray(message[0])) {
          console.log('Message is array of messages, sending each one individually. Operation aborted.');
          return;
        }

        !!message && socket.send(JSON.stringify(message));
      };

      callback(socket);
    });
  }

  bindClientDisconnect(socket: OCPPSocket, callback: Function) {
    socket.on('close', () => {
      this.logger.log(`Client disconnected: ${socket.station.id}`);
      callback(socket)
    });
  }

  async bindMessageHandlers(
    socket: OCPPSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ) {
    bindCallHandler(socket, handlers, process, this.logger);
    bindCallResultHandler(socket, handlers, process, this.logger);
  }

  close(server) {
    server.close();
  }
}
