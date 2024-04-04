import { OCPPResponse } from '@/types/ocpp/call-result';
import { ChargingProfile } from '../common/charge';
import { OCPPCall } from '@/types/ocpp/call';

export class TransactionRequest extends OCPPCall {
  idTag: string;
  timestamp?: string;
  constructor(action: string, transactionId?: string | number) {
    super(action, transactionId);
  }
}

export class TransactionData {
  values: MeterValue[];
  timestamp: string;
}

export class StartTransactionRequest extends TransactionRequest {
  connectorId: number;
  meterStart: number;
}

export class TransactionResponse extends OCPPResponse {
  transactionId: number;

  constructor(uniqueId: string) {
    super(uniqueId);
  }

  static createAccepted(uniqueId: string, transactionId: string) {
    return new TransactionResponse(uniqueId).createResult({
      idTagInfo: { status: 'Accepted' },
      transactionId: Number(transactionId),
    });
  }

  static invalidTag(uniqueId: string) {
    return new TransactionResponse(uniqueId).createResult({
      idTagInfo: { status: 'Invalid' },
    });
  }
}

export class StartTransactionResponse extends TransactionResponse {
  connectorId: number;
  meterStart: number;
  idTag: string;
  status: 'Accepted' | 'Rejected';
  constructor(uniqueId: string) {
    super(uniqueId);
  }
}
export class StopTransactionResponse extends TransactionResponse {
  meterStop: number;
  connectorId: number;
  status: 'Accepted' | 'Rejected';
  idTag: string;
}

export class SampledValue {
  value: string;
  context?: string;
  format?: string;
  measurand?: string;
  location?: string;
  unit?: string;
  timeUnit?: string;
}

export class MeterValue {
  timestamp: string;
  sampledValue: SampledValue[];
}

export class MeterValueRequest extends OCPPCall {
  connectorId: number;
  transactionId?: number;
  values: MeterValue[];
  constructor(args: Partial<MeterValueRequest>) {
    super('MeterValues');
    Object.assign(this, args);
  }
}

export class MeterValueResponse extends OCPPResponse {
  connectorId: number;
  meterValue: MeterValue[];

  constructor(uniqueId: string) {
    super(uniqueId);
  }
}

export class RemoteStopTransactionRequest extends TransactionRequest {
  transactionId: number;
  meterStop: number;
  transactionData?: TransactionData[];
  idTag: string;
  
  constructor(args: Partial<RemoteStopTransactionRequest>) {
    super('RemoteStopTransaction', args.transactionId);
    Object.assign(this, args);
  }
}

export class RemoteStartTransactionRequest extends TransactionRequest {
  connectorId: number;
  idTag: string;
  chargingProfile?: Partial<ChargingProfile>;
  transactionId: number;

  constructor(args: Partial<RemoteStartTransactionRequest>) {
    super('RemoteStartTransaction', args.transactionId);
    Object.assign(this, args);
  }
}
