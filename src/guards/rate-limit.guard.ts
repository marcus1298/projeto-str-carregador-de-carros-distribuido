import { BLACKLIST_KEY } from '@/types/constants/blacklist';
import { ATTEMPTS_KEY, ATTEMPTS_TTL, MAX_ATTEMPTS, SKIP_RATE_LIMITING_KEY } from '@/types/constants/rate-limit';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import * as RequestIp from 'request-ip';

@Injectable()
export class RateLimitGuard implements CanActivate {

    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache, private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const blacklist = await this.cacheManager.get<string[]>(BLACKLIST_KEY) ?? [];
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();

        const skip = this.reflector.get<boolean>(SKIP_RATE_LIMITING_KEY, context.getHandler());

        if (skip) {
            return true;
        }

        const ip = RequestIp.getClientIp(request);

        const attempts = (await this.cacheManager.get<number>(`${ATTEMPTS_KEY}${ip}`)) ?? 0;

        await this.cacheManager.set(`${ATTEMPTS_KEY}${ip}`, (attempts + 1), ATTEMPTS_TTL);

        if (blacklist.includes(ip)) {
            await this.cacheManager.set(BLACKLIST_KEY, blacklist, 24 * 60 * 60 * 1000);
            return false;
        }

        if (attempts > MAX_ATTEMPTS) {
            blacklist.push(ip);
            await this.cacheManager.set(BLACKLIST_KEY, blacklist, 24 * 60 * 60 * 1000);
            return false;
        }

        return true;
    }
}
