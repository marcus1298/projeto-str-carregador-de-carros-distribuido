import { OCPPSocket } from '@/types/ocpp/socket';
export class StopTransactionEvent {
  uniqueId: string;
  pointId: string;
  meterStop: number;
  socket: OCPPSocket;
  status: 'Accepted' | 'Rejected';
  transactionId: number;

  constructor(args: StopTransactionEvent) {
    Object.assign(this, args);
  }
}
