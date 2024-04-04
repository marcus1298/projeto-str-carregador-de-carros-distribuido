import { DocumentReference } from '@google-cloud/firestore';
import { Base } from './base.entity';
import { ChargerPoint } from './charger-point.entity';
import { ChargerZone } from './charger-zone.entity';

export const ChargerStationBasePath = 'chargerStations';

export enum ChargerStationStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
}
export interface ChargerStation extends Base {
  points: Array<ChargerPoint>;
  status: ChargerStationStatus;
  onlyVoucher?: boolean;
  zone: DocumentReference<ChargerZone>;
}

export class ChargerStationPathFactory {
  static create(uid: string): string {
    return `${ChargerStationBasePath}/${uid}`;
  }
}
