import { ChargerStationStatus } from '@/entities/charger-station.entity';

export class GetStationQuery {
  constructor(readonly args: { uid: string; getRef?: boolean; cache?: boolean }) {}
}

export class UpdateStationStatusQuery {
  constructor(readonly args: { uid: string; status: ChargerStationStatus }) {}
}
