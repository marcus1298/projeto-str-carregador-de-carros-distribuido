import { ChargerGateway } from '@/charger/charger.gateway';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class PointGuard implements CanActivate {
  constructor(private readonly chargerGateway: ChargerGateway) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const { csId, pointId } = request.params;

    const stationMapValue = this.chargerGateway.stationsMap.get(csId);

    return !!stationMapValue && !!stationMapValue.pointsMap?.get(pointId);
  }
}
