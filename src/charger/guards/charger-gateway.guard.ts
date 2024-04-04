import { ChargerGateway } from '@/charger/charger.gateway';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ChargerGatewayGuard implements CanActivate {
  constructor(private readonly chargerGateway: ChargerGateway) {}

  async canActivate(context: ExecutionContext) {
    const socket = context.switchToWs().getClient();

    const { stationId } = socket;
    
    return !!stationId && !!this.chargerGateway.stationsMap.get(stationId);
  }
}
