// users.pipe.ts
import {
  ArgumentMetadata,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  PipeTransform,
  UnauthorizedException,
} from '@nestjs/common';
import { ChargerGateway } from '../charger.gateway';

export const ExtractChargerPoint = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    const { csId, pointId } = request.params;

    return { csId, pointId };
  },
);

@Injectable()
export class ChargerPointPipe implements PipeTransform {
  public constructor(private readonly chargerGateway: ChargerGateway) {}

  public async transform(
    info: { csId: string; pointId: string },
    _metadata: ArgumentMetadata,
  ) {
    try {
      const stationMapValue = this.chargerGateway.stationsMap.get(info.csId);

      return stationMapValue.pointsMap.get(info.pointId);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid stationId');
    }
  }
}
