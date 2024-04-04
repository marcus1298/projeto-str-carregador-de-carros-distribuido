import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ChargerGateway } from './charger.gateway';

import { ChargerPointController } from './charger-point.controller';

import * as EventHandlers from './events';
import * as QueryHandlers from './queries';
import { ChargerPointStatusService } from './services/charger-point-status.service';

@Module({
  imports: [CqrsModule],
  providers: [
    ChargerGateway,
    {
      provide: 'METER_SAMPLE_RATE',
      useValue: 10,
    },
    {
      provide: 'HEARTBEAT_INTERVAL',
      useValue: 30,
    },
    {
      provide: 'METER_ALIGNED_DATA',
      useValue:
        'Current.Import,Energy.Active.Import.Register,Power.Active.Import,Power.Offered,SoC,Voltage',
    },
    {
      provide: 'METER_SAMPLED_DATA',
      useValue:
        'Current.Import,Energy.Active.Import.Register,Power.Active.Import,Power.Offered,SoC,Voltage',
    },
    ...Object.values(EventHandlers),
    ...Object.values(QueryHandlers),
    ChargerPointStatusService,
  ],
  controllers: [ChargerPointController],
})
export class ChargerModule {}
