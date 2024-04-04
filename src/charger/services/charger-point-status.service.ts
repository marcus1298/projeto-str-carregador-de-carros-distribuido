import { ChargerPointStatus } from '@/entities/charger-point.entity';
import { TransactionStatus } from '@/entities/transaction.entity';
import { OCPPSocket } from '@/types/ocpp/socket';
import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  GetChargerPointCurrentTransactionQuery,
  UpdateChargerPointQuery,
} from '../queries/types/connector.query';
import { UpdateTransactionQuery } from '../queries/types/transaction.query';
import { TriggerMessageCall } from '../types/config/configuration.message';
import { StatusNotificationRequest } from '../types/status/status-notification.message';
import { OCPPRequest } from '@/types/ocpp/call';

@Injectable()
export class ChargerPointStatusService {
  constructor(private queryBus: QueryBus, private schedulerRegistry: SchedulerRegistry) {}

  async handleStatusNotification(
    socket: OCPPSocket,
    request: OCPPRequest<StatusNotificationRequest>,
  ) {
    const { payload } = request;

    try {
      const stationId = String(socket.station.id);
      const pointId = String(payload.connectorId);
      const status = String(payload.status)?.toUpperCase();

      if(!socket.station.points.some(point => point.id === pointId)){
        return;
      }

      await this.updateChargerPointStatus(stationId, pointId, payload);

      switch (status) {
        case ChargerPointStatus.CHARGING:
          await this.handleCharging(socket, pointId);
          break;
        case ChargerPointStatus.FINISHING:
          this.handleFinishing(socket, pointId);
          break;
        default:
          break;
      }
    } catch (e) {
      console.error(e);
    }
  }

  async updateChargerPointStatus(
    stationId: string,
    pointId: string,
    payload: StatusNotificationRequest,
  ) {
    if (!stationId || !pointId) return;

    await this.queryBus.execute(
      new UpdateChargerPointQuery({
        stationId,
        pointId,
        ...payload,
      }),
    );
  }

  async handleCharging(socket: OCPPSocket, pointId: string) {
    try {
      const stationId = String(socket.station.id);
      const key = `${stationId}-${pointId}-transaction`;

      const intervalExists = this.schedulerRegistry.doesExist('interval', key);

      if (intervalExists) this.schedulerRegistry.deleteInterval(key);

      const transaction = await this.queryBus.execute(
        new GetChargerPointCurrentTransactionQuery({ stationId, pointId }),
      );

      if (transaction) {
        await this.queryBus.execute(
          new UpdateTransactionQuery({
            id: String(transaction.id),
            stationId: socket.station.id,
            pointId,
            status: TransactionStatus.CHARGING,
          }),
        );

        const interval = setInterval(() => {
          socket.sendMessage(new TriggerMessageCall('MeterValues', Number(pointId)).create());
        }, 10 * 1000);

        this.schedulerRegistry.addInterval(key, interval);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async handleFinishing(socket: OCPPSocket, pointId: string) {
    try {
      const stationId = String(socket.station.id);

      const key = `${stationId}-${pointId}-transaction`;
      const intervalExists = this.schedulerRegistry.doesExist('interval', key);

      const currentTransaction = await this.queryBus.execute(
        new GetChargerPointCurrentTransactionQuery({ stationId, pointId }),
      );

      if (currentTransaction)
        await this.queryBus.execute(
          new UpdateTransactionQuery({
            id: String(currentTransaction.id),
            stationId: socket.station.id,
            pointId: pointId,
            status: TransactionStatus.FINISHING,
          }),
        );

      if (intervalExists) this.schedulerRegistry.deleteInterval(key);
    } catch (e) {
      console.log(e);
    }
  }
}
