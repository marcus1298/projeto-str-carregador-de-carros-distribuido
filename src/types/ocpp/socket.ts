import { ChargerPoint } from '@/entities/charger-point.entity';
import { ChargerStation } from '@/entities/charger-station.entity';
import { WsException } from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { OCPPCallMessage } from './call';
import { OCPPCallErrorMessage } from './call-result';

export class StationMapValue {
  socket: OCPPSocket;
  station: ChargerStation;
  pointsMap: Map<string, ChargerPoint>;

  constructor(socket: OCPPSocket) {
    const points = new Map<string, any>();
    const station = socket.station;

    station.points.forEach((point) => points.set(point.id, { ...point, id: point.id }));

    this.socket = socket;
    this.station = station;
    this.pointsMap = points;
  }
}

export interface OCPPSocket extends WebSocket {
  station: ChargerStation;
  isAlive: boolean;
  sendMessage(message: OCPPCallErrorMessage | OCPPCallMessage | Array<OCPPCallMessage | OCPPCallMessage>): void;
  sendError(exception: WsException): void;
  destroy(): void;
}
