import { BLACKLIST_KEY } from '@/types/constants/blacklist';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import * as RequestIp from 'request-ip';

@Injectable()
export class AdminRouteGuard implements CanActivate {
    constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const blacklist = await this.cacheManager.get<string[]>(BLACKLIST_KEY) ?? [];
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();
        const ip = RequestIp.getClientIp(request);

        if (blacklist.includes(ip)) {
            await this.cacheManager.set(BLACKLIST_KEY, blacklist, 24 * 60 * 60 * 1000);

            return false;
        }

        const key = request.headers['x-api-key'] as string;

        if (key !== process.env.API_KEY) {
            blacklist.push(ip);
            await this.cacheManager.set(BLACKLIST_KEY, blacklist, 24 * 60 * 60 * 1000);

            return false;
        }

        return true;
    }
}