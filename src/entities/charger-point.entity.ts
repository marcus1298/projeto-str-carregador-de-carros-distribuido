import { DocumentReference } from '@google-cloud/firestore';
import { Base } from './base.entity';
import { ChargerStationBasePath } from './charger-station.entity';
import { Transaction } from './transaction.entity';

export const ChargerPointBasePath = 'chargerPoints';

export interface ConnectorModel extends Base {}

export enum ChargerPointStatus {
  AVAILABLE = 'AVAILABLE',
  PREPARING = 'PREPARING',
  CHARGING = 'CHARGING',
  SUSPENDEDEV = 'SUSPENDEDEV',
  OCCUPIED = 'OCCUPIED',
  FINISHING = 'FINISHING',
  RESERVED = 'RESERVED',
  FAULTED = 'FAULTED',
  UNPLUGGED = 'UNPLUGGED',
  OFFLINE = 'OFFLINE',
}

export interface ChargerPoint extends Base {
  connectorId: number;
  connectorModel: DocumentReference<ConnectorModel>;
  description: string;
  isVisible: boolean;
  powerKW: number;
  status: ChargerPointStatus;
  currentTransaction: DocumentReference<Transaction> | null;
}

export class ChargerPointPathFactory {
  static create(args: { stationId: string; pointId: string }): string {
    const { stationId, pointId } = args;
    return `${ChargerStationBasePath}/${stationId}/${ChargerPointBasePath}/${pointId}`;
  }
}
