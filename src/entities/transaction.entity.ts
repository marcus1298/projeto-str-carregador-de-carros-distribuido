import { MeterValue } from '@/charger/types/transaction/transaction.message';
import { DocumentReference } from '@google-cloud/firestore';
import { Base } from './base.entity';
import { ChargerPoint, ChargerPointBasePath } from './charger-point.entity';
import { ChargerStationBasePath } from './charger-station.entity';
import { User } from './user.entity';
import { Voucher } from './voucher.entity';

export const TransactionBasePath = 'transactions';

export enum TransactionStatus {
  INITIALIZING = 'INITIALIZING',
  WAITING = 'WAITING',
  CHARGING = 'CHARGING',
  FAULTED = 'FAULTED',
  REJECTED = 'REJECTED',
  STOPPED = 'STOPPED',
  FINISHING = 'FINISHING',
  COMPLETED = 'COMPLETED',
}

export class TransactionData {
  timestamp: number;
  energy: number;
  power: number;

  constructor(args: MeterValue) {
    this.timestamp = new Date(args.timestamp)?.getTime();
    this.energy = Number(
      args.sampledValue.find((v) => v.measurand === 'Energy.Active.Import.Register')?.value,
    );
    this.power = Number(
      args.sampledValue.find((v) => v.measurand === 'Power.Active.Import')?.value,
    );
  }
}

export interface Transaction extends Base {
  stationId: string;
  pointId: string;
  pointRef: DocumentReference<ChargerPoint>;
  voucherId?: string;
  voucherRef?: DocumentReference<Voucher>;
  userRef: DocumentReference<User>;
  status: TransactionStatus;
  meterStart: number;
  meterStop: number;
  data: TransactionData[];
}

export class TransactionPathFactory {
  static create(args: { stationId: string; pointId: string; transactionId: string }): string {
    const { stationId, pointId, transactionId } = args;
    return `${ChargerStationBasePath}/${stationId}/${ChargerPointBasePath}/${pointId}/${TransactionBasePath}/${transactionId}`;
  }
}
