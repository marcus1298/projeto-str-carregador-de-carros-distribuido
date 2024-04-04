import { Inject, LoggerService } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { StartTransactionEvent } from '../types/transaction-start.event';

@EventsHandler(StartTransactionEvent)
export class StartTransactionEventHandler implements IEventHandler<StartTransactionEvent> {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) { }

  async handle(event: StartTransactionEvent) {
    const { transactionId } = event;
    try {
    } catch (e) {
      this.logger.error(`Remote start event - Error`, {
        event: {
          transactionId,
        },
        error: e.message,
        stack: 'RemoteStartEventHandler.execute',
      });
    }
  }
}
