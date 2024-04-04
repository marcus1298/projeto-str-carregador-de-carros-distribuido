import { SetMetadata } from '@nestjs/common';

export const ATTEMPTS_KEY = `ocpp:attempts`;
export const ATTEMPTS_TTL = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 30;
export const SKIP_RATE_LIMITING_KEY = 'skipRateLimiting';
export const SkipRateLimiting = () => SetMetadata(SKIP_RATE_LIMITING_KEY, true);
