import { OCPPSocket } from '@/types/ocpp/socket';

export class StartTransactionEvent {
  status: 'Accepted' | 'Rejected';
  transactionId: number;
  connectorId: number;
  meterStart: number;
  socket: OCPPSocket;
  
  constructor(args: StartTransactionEvent) {
    Object.assign(this, args);
  }
}
