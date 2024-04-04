import { ChargerPoint } from '@/entities/charger-point.entity';
import { TransactionStatus } from '@/entities/transaction.entity';
import { User } from '@/entities/user.entity';
import { AuthGuard } from '@/guards/auth.guard';
import { ChargerGuard } from '@/guards/charger.guard';
import { DistanceGuard } from '@/guards/distance.guard';
import { PointGuard } from '@/guards/point.guard';
import { VoucherGuard } from '@/guards/voucher.guard';
import { OCPPSocket } from '@/types/ocpp/socket';
import { AddUserTransactionHistoryQuery } from '@/user/queries/types/user.query';
import {
  BadRequestException,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventBus, QueryBus, ofType } from '@nestjs/cqrs';
import { filter } from 'rxjs';
import { StartTransactionEvent } from './events/types/transaction-start.event';
import { StopTransactionEvent } from './events/types/transaction-stop.event';
import { ChargerPointPipe, ExtractChargerPoint } from './pipes/charger-point.pipe';
import { ExtractSocketPipe, SocketPipe } from './pipes/socket.pipe';
import { ExtractUser, UserPipe } from './pipes/user.pipe';
import { CreateTransactionQuery, UpdateTransactionQuery } from './queries/types/transaction.query';
import {
  RemoteStartTransactionRequest,
  RemoteStopTransactionRequest,
} from './types/transaction/transaction.message';

@UseGuards(AuthGuard, ChargerGuard, PointGuard)
@Controller('chargers/:csId/points/:pointId')
export class ChargerPointController {
  constructor(private readonly eventBus: EventBus, private readonly queryBus: QueryBus) { }

  @UseGuards(DistanceGuard(200), VoucherGuard)
  @Post('start-transaction')
  async startTransaction(
    @ExtractUser(UserPipe) user: User,
    @ExtractSocketPipe(SocketPipe) socket: OCPPSocket,
    @ExtractChargerPoint(ChargerPointPipe) point: ChargerPoint,
    @Query('voucherId') voucherId?: string,
  ) {
    try {
      const transactionId = await this.queryBus.execute<CreateTransactionQuery, number>(
        new CreateTransactionQuery({
          stationId: socket.station.id,
          pointId: point.id,
          meterStart: 0,
          user,
          voucherId,
        }),
      );

      if (!transactionId) {
        throw new BadRequestException('Não foi possível iniciar o carregamento.');
      }

      const startCall = new RemoteStartTransactionRequest({
        connectorId: Number(point.id),
        idTag: transactionId.toString(),
        transactionId,
      });

      socket.sendMessage(startCall.create());

      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject();
        }, 60000);
        this.eventBus.subject$
          .pipe(
            ofType(StartTransactionEvent),
            filter((event: StartTransactionEvent) => event.transactionId === transactionId),
          )
          .subscribe(async (event: StartTransactionEvent) => {
            try {
              if (event.status === 'Rejected') {

                await this.queryBus.execute(
                  new UpdateTransactionQuery({
                    id: String(transactionId),
                    stationId: socket.station.id,
                    pointId: point.id,
                    status: TransactionStatus.REJECTED,
                  }),
                );
                return reject();
              }

              clearTimeout(timeout);

              await this.queryBus.execute(
                new UpdateTransactionQuery({
                  id: String(transactionId),
                  stationId: socket.station.id,
                  pointId: point.id,
                  status: TransactionStatus.WAITING,
                }),
              );

              resolve({ transactionId });
            } catch (e) {
              throw new BadRequestException('Não foi possível iniciar o carregamento.');
            } finally {
              if (user)
                this.queryBus.execute(new AddUserTransactionHistoryQuery({ uid: user.id, transactionId: String(transactionId), status: event.status, voucherId })).catch((e) => {
                  console.log('Não foi possível adicionar o histórico de transação do usuário.');
                });
            }
          });
      }).catch((e) => {
        throw new BadRequestException('Não foi possível iniciar o carregamento.');
      });
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }

      throw new BadRequestException('Não foi possível iniciar o carregamento.');
    }
  }
  @UseGuards(DistanceGuard(200))
  @Post('stop-transaction/:transactionId')
  async stopTransaction(
    @ExtractSocketPipe(SocketPipe) socket: OCPPSocket,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    try {
      if (!transactionId) {
        throw new Error();
      }

      const stopCall = new RemoteStopTransactionRequest({
        transactionId,
      });

      socket.sendMessage(stopCall.create());

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject();
        }, 60000);
        this.eventBus.subject$
          .pipe(
            ofType(StopTransactionEvent),
            filter((event: StopTransactionEvent) => event.transactionId === transactionId),
          )
          .subscribe((event: StopTransactionEvent) => {
            clearTimeout(timeout);
            if (event.status === 'Rejected') {
              reject();
            }
            resolve(null);
          });
      }).catch((e) => {
        throw new BadRequestException('Não foi possível parar o carregamento.');
      });
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
