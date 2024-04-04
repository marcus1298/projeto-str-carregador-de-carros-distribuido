import { parseRequest } from '@/helpers/request-parser.helper';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  mixin,
} from '@nestjs/common';
import { getDistance } from 'geolib';

interface DistanceGuardMetadata {
  user: {
    latitude: number;
    longitude: number;
  };
  station: {
    latitude: number;
    longitude: number;
  };
}

function validateUserDistanceFromStation(
  metadata: DistanceGuardMetadata,
  maxDistance: number,
) {
  if (!metadata) return true;

  const { user, station } = metadata;

  const distance = getDistance(
    {
      latitude: user.latitude,
      longitude: user.longitude,
    },
    {
      latitude: station.latitude,
      longitude: station.longitude,
    },
  );

  if (isNaN(distance)) {
    return true;
  }

  if (distance > maxDistance) {
    throw new BadRequestException({
      message:
        'Você está muito longe da estação de recarga. Deseja prosseguir?',
      errorCode: 'MAX_DISTANCE_EXCEEDED',
    });
  }

  return true;
}

export const DistanceGuard = (maxDistance: number) => {
  class DistanceGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest();

      const body = parseRequest(request);

      return (
        !!body.force ||
        validateUserDistanceFromStation(body.metadata, maxDistance)
      );
    }
  }

  const guard = mixin(DistanceGuardMixin);

  return guard;
};
