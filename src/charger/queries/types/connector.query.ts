import { ChargerPoint } from '@/entities/charger-point.entity';

export class UpdateChargerPointQuery {
  constructor(readonly args: Partial<ChargerPoint> & { stationId: string; pointId: string }) {}
}

export class GetChargerPointCurrentTransactionQuery {
  constructor(readonly args: { stationId: string; pointId: string }) {}
}
