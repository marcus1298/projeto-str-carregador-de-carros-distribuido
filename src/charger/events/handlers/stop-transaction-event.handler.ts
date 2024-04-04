import { UpdateTransactionQuery } from '@/charger/queries/types/transaction.query';
import { MeterValueRequest } from '@/charger/types/transaction/transaction.message';
import { TransactionStatus } from '@/entities/transaction.entity';
import { Inject, LoggerService } from '@nestjs/common';
import { EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { StopTransactionEvent } from '../types/transaction-stop.event';

@EventsHandler(StopTransactionEvent)
export class StopTransactionEventHandler implements IEventHandler<StopTransactionEvent> {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly queryBus: QueryBus,
  ) {}

  async handle(event: StopTransactionEvent) {
    const { socket, pointId, transactionId, meterStop, status } = event;
    try {
      if (status === 'Rejected') {
        return;
      }

      const stationId = socket.station.id;

      await this.queryBus.execute(
        new UpdateTransactionQuery({
          id: String(transactionId),
          pointId,
          stationId,
          meterStop,
          status: TransactionStatus.STOPPED,
        }),
      );
    } catch (e) {
      this.logger.error(`Remote stop event - Error`, {
        event: {
          transactionId,
        },
        error: e.message,
        stack: 'RemoteStopEventHandler.execute',
      });
    }
  }
}
