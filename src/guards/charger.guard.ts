import { ChargerGateway } from '@/charger/charger.gateway';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ChargerGuard implements CanActivate {
  constructor(private readonly chargerGateway: ChargerGateway) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const { csId } = request.params;

    const stationMapValue = this.chargerGateway.stationsMap.get(csId);

    if(!stationMapValue) {
      return false;
    }

    return !!stationMapValue;
  }
}
