import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Delete, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { AdminRouteGuard } from './guards/admin-route.guard';
import { SkipRateLimiting } from './types/constants/rate-limit';

@Controller()
export class AppController {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) { }

  @Post('health')
  @SkipRateLimiting()
  checkHealthPost(): string {
    return 'OK';
  }

  @Get('health')
  @SkipRateLimiting()
  checkHealthGet(): string {
    return 'OK';
  }

  @Get('error')
  @SkipRateLimiting()
  throwError(): string {
    throw new Error('Test error');
  }

  @UseGuards(AdminRouteGuard)
  @Delete('cache')
  @SkipRateLimiting()
  async clearCache(): Promise<string> {
    await this.cacheManager.reset();
    return 'OK';
  }
}