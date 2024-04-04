import {
  ArgumentMetadata,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  PipeTransform,
  UnauthorizedException,
} from '@nestjs/common';
import { ChargerGateway } from '../charger.gateway';

export const ExtractChargerStation = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    const { csId } = request.params;

    return csId;
  },
);

@Injectable()
export class ChargerStationPipe implements PipeTransform {
  public constructor(private readonly chargerGateway: ChargerGateway) {}

  public async transform(stationId: string, _metadata: ArgumentMetadata) {
    try {
      const stationMapValue = this.chargerGateway.stationsMap.get(stationId);

      return stationMapValue.station;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid stationId');
    }
  }
}
