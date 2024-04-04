import { Base } from './base.entity';

export const ChargerZoneBasePath = 'chargerZones';

interface Location {
  latitude: number;
  longitude: number;
}

export interface ChargerZone extends Base {
  location: Location;
  isPrivate: boolean;
  isVisible: boolean;
}

export class ChargerZonePathFactory {
  static create(uid: string): string {
    return `${ChargerZoneBasePath}/${uid}`;
  }
}
