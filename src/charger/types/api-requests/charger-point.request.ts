import { ChargerPoint } from '@/entities/charger-point.entity';
import { ChargerStation } from '@/entities/charger-station.entity';
import { OCPPSocket } from '@/types/ocpp/socket';

export interface ChargerPointRequest {
  uid: string;
  station: ChargerStation;
  socket: OCPPSocket;
  point: ChargerPoint;
}
