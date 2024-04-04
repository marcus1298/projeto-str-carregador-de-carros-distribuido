import { ChargerStationStatus } from '@/entities/charger-station.entity';
import { OCPPRequest } from '@/types/ocpp/call';
import { OCPPSocket, StationMapValue } from '@/types/ocpp/socket';
import { QueryBus } from '@nestjs/cqrs';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { UpdateStationStatusQuery } from './queries/types/station.query';
import {
  BootNotificationRequest,
  BootNotificationResponse,
} from './types/boot/boot-notification.message';
import {
  ChangeConfigurationCall,
  GetConfigurationCall,
  GetConfigurationResponse,
  TriggerMessageCall,
} from './types/config/configuration.message';

export class ChargerConfigurationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  stationsMap = new Map<string, StationMapValue>();

  constructor(
    private readonly heartbeatInterval: number,
    private readonly meterAlignedData: string,
    private readonly meterSampledData: string,
    private readonly meterSampleRate: number,
    readonly queryBus: QueryBus,
  ) { }

  triggerConnectorStatuses(socket: OCPPSocket) {
    let i = 0;

    for (const point of socket.station.points) {
      setTimeout(() => {
        socket.sendMessage(
          new TriggerMessageCall('StatusNotification', Number(point.id)).create(),
        );
      }, 3000 * i);
      i++;
    }
  }

  async handleConnection(socket: OCPPSocket) {
    try {
      const stationId = socket.station.id;

      this.stationsMap.set(stationId, new StationMapValue(socket));

      await this.queryBus.execute(
        new UpdateStationStatusQuery({
          uid: stationId,
          status: ChargerStationStatus.ONLINE,
        }),
      );
    } catch (e) {
      socket.close();
    }
  }

  async handleDisconnect(socket: OCPPSocket) {
    this.stationsMap.delete(socket.station.id);

    await this.queryBus.execute(
      new UpdateStationStatusQuery({
        uid: socket.station.id,
        status: ChargerStationStatus.OFFLINE,
      }),
    );
  }

  @SubscribeMessage('BootNotification')
  handleBootNotification(
    @ConnectedSocket() socket: OCPPSocket,
    @MessageBody() data: OCPPRequest<BootNotificationRequest>) {
    try {
      const { uniqueId } = data;

      this.queryBus.execute(
        new UpdateStationStatusQuery({
          uid: socket.station.id,
          status: ChargerStationStatus.ONLINE,
        }),
      );

      return new BootNotificationResponse(uniqueId, Number(this.heartbeatInterval)).createResult();
    } finally {
      setTimeout(() => { this.triggerConnectorStatuses(socket) }, 3000);
      setTimeout(() => { socket.sendMessage(new GetConfigurationCall().create()); }, 6000);
    }
  }

  @SubscribeMessage('GetConfigurationResult')
  handleGetConfigurationResult(
    @ConnectedSocket() socket: OCPPSocket,
    @MessageBody() data: GetConfigurationResponse
  ) {
    try {
      const { configurationKey } = data;
      const csMeterValuesAlignedData = configurationKey.find(config => config.key === 'MeterValuesAlignedData')?.value;
      const csMeterValuesSampledData = configurationKey.find(config => config.key === 'MeterValuesSampledData')?.value;
      const csMeterValueSampleInterval = configurationKey.find(config => config.key === 'MeterValueSampleInterval')?.value;

      let i = 0;
      if (csMeterValuesAlignedData) {
        const properties = csMeterValuesAlignedData.split(',');
        if (this.meterAlignedData.split(',').length !== properties.length) {
          setTimeout(() => { socket.sendMessage(new ChangeConfigurationCall('MeterValuesAlignedData', this.meterAlignedData).create()); }, i * 1000);
          i++;
        }
      }

      if (csMeterValuesSampledData) {
        const properties = csMeterValuesSampledData.split(',');
        if (this.meterSampledData.split(',').length !== properties.length) {
          setTimeout(() => { socket.sendMessage(new ChangeConfigurationCall('MeterValuesSampledData', this.meterSampledData).create()); }, i * 1000);
          i++;
        }
      }

      if (csMeterValueSampleInterval) {
        if (this.meterSampleRate !== Number(csMeterValueSampleInterval)) {
          setTimeout(() => { socket.sendMessage(new ChangeConfigurationCall('MeterValueSampleInterval', this.meterSampleRate).create()); }, i * 1000);
          i++;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}
