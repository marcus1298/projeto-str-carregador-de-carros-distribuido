import { Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';

import { ChargerStationStatus } from '@/entities/charger-station.entity';
import { Transaction, TransactionData } from '@/entities/transaction.entity';
import { OCPPRequest } from '@/types/ocpp/call';
import { OCPPResponse, OCPPResponseErrorCode } from '@/types/ocpp/call-result';
import { OCPPSocket, StationMapValue } from '@/types/ocpp/socket';
import { EventBus, QueryBus } from '@nestjs/cqrs';
import { ChargerConfigurationGateway } from './charger-configuration.gateway';
import { StartTransactionEvent } from './events/types/transaction-start.event';
import { StopTransactionEvent } from './events/types/transaction-stop.event';
import { GetChargerPointCurrentTransactionQuery } from './queries/types/connector.query';
import { UpdateStationStatusQuery } from './queries/types/station.query';
import { AddTransactionDataQuery } from './queries/types/transaction.query';
import { ChargerPointStatusService } from './services/charger-point-status.service';
import { HeartbeatRequest, HeartbeatResponse } from './types/config/heartbeat.message';
import {
  StatusNotificationRequest,
  StatusNotificationResponse,
} from './types/status/status-notification.message';
import {
  MeterValueResponse,
  StartTransactionRequest,
  StartTransactionResponse,
  StopTransactionResponse,
  TransactionResponse
} from './types/transaction/transaction.message';

@WebSocketGateway()
export class ChargerGateway extends ChargerConfigurationGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('HEARTBEAT_INTERVAL') heartbeatInterval: number,
    @Inject('METER_SAMPLE_RATE') meterSampleRate: number,
    @Inject('METER_ALIGNED_DATA') meterAlignedData: string,
    @Inject('METER_SAMPLED_DATA') meterSampledData: string,
    private eventBus: EventBus,
    private chargerPointStatusService: ChargerPointStatusService,
    queryBus: QueryBus,
  ) {
    super(heartbeatInterval, meterAlignedData, meterSampledData, meterSampleRate, queryBus);
  }

  @SubscribeMessage('Heartbeat')
  async handleHeartbeat(
    @MessageBody() data: OCPPRequest<HeartbeatRequest>,
    @ConnectedSocket() socket: OCPPSocket,
  ) {
    try {
      const { uniqueId } = data;

      this.stationsMap.set(socket.station.id, new StationMapValue(socket));

      this.queryBus
        .execute(
          new UpdateStationStatusQuery({
            uid: socket.station.id,
            status: ChargerStationStatus.ONLINE,
          }),
        )
        .catch((e) => console.log(e));

      return new HeartbeatResponse(uniqueId).createResult();
    } finally {
      this.triggerConnectorStatuses(socket);
    }
  }

  @SubscribeMessage('StatusNotification')
  async handleStatus(
    @MessageBody() request: OCPPRequest<StatusNotificationRequest>,
    @ConnectedSocket() socket: OCPPSocket,
  ) {
    const { uniqueId } = request;
    try {
      this.chargerPointStatusService
        .handleStatusNotification(socket, request)
        .catch((e) => console.log(e));

      return new StatusNotificationResponse(uniqueId).createResult();
    } catch (e) {
      console.log(e);
      return TransactionResponse.createError(uniqueId, OCPPResponseErrorCode.INTERNAL_ERROR);
    }
  }

  @SubscribeMessage('RemoteStartTransactionResult')
  handleRemoteStartTransaction(
    @MessageBody() data: StartTransactionResponse,
    @ConnectedSocket() socket: OCPPSocket,
  ) {
    this.eventBus.publish(new StartTransactionEvent({ socket, ...data }));
  }

  @SubscribeMessage('StartTransaction')
  async handleStartTransaction(
    @MessageBody() data: OCPPRequest<StartTransactionRequest>,
    @ConnectedSocket() socket: OCPPSocket,
  ) {
    const { uniqueId, payload } = data;

    const transaction = await this.queryBus.execute<
      GetChargerPointCurrentTransactionQuery,
      Transaction
    >(
      new GetChargerPointCurrentTransactionQuery({
        pointId: String(payload.connectorId),
        stationId: socket.station.id,
      }),
    );

    if (!transaction)
      return TransactionResponse.createError(uniqueId, OCPPResponseErrorCode.INTERNAL_ERROR);

    return TransactionResponse.createAccepted(uniqueId, transaction.id);
  }

  @SubscribeMessage('StopTransaction')
  handleStopTransaction(
    @MessageBody() data: OCPPRequest<StopTransactionResponse>,
    @ConnectedSocket() socket: OCPPSocket,
  ) {
    const { uniqueId, payload } = data;
    this.eventBus.publish(
      new StopTransactionEvent({
        socket,
        uniqueId,
        ...payload,
        pointId: payload.connectorId ? String(payload.connectorId) : undefined,
        transactionId: Number(
          payload.idTag ?? !!payload.transactionId ? payload.transactionId : undefined,
        ),
      }),
    );

    return new OCPPResponse(data.uniqueId).createResult();
  }

  @SubscribeMessage('RemoteStopTransactionResult')
  handleRemoteStopTransaction(
    @MessageBody() data: StopTransactionResponse,
    @ConnectedSocket() socket: OCPPSocket,
  ) {
    try {
      const { uniqueId, idTag, connectorId, transactionId } = data;

      this.eventBus.publish(
        new StopTransactionEvent({
          socket,
          uniqueId,
          ...data,
          pointId: connectorId ? String(connectorId) : undefined,
          transactionId: Number(idTag ?? !!transactionId ? transactionId : undefined ?? uniqueId),
        }),
      );
    } catch (e) {
      console.log(e);
    }
  }

  @SubscribeMessage('MeterValues')
  async handleMeterValues(
    @MessageBody() data: OCPPRequest<MeterValueResponse>,
    @ConnectedSocket() socket: OCPPSocket,
  ) {
    const { uniqueId, payload } = data;

    if (!payload.meterValue?.length) {
      return new MeterValueResponse(uniqueId).createResult();
    }

    this.queryBus
      .execute(
        new AddTransactionDataQuery({
          stationId: socket.station.id,
          pointId: String(payload.connectorId),
          data: payload.meterValue.map((value) => new TransactionData(value)),
        }),
      )
      .catch((e) => console.log(e));

    return new MeterValueResponse(uniqueId).createResult();
  }
}
