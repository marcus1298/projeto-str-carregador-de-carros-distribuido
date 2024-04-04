import { CacheModule } from '@nestjs/cache-manager';
import { HttpException, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import {
  ConfigurationModule,
  FirebaseModule,
  GoogleSecretService,
  LogtailModule,
} from '@star-ev/nestjs-config';
import { OpensearchModule } from 'nestjs-opensearch';
import * as packageJson from '../package.json';
import { AppController } from './app.controller';
import { ChargerModule } from './charger/charger.module';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { UserModule } from './user/user.module';
import { VoucherModule } from './voucher/voucher.module';

@Module({
  imports: [
    CacheModule.register({ isGlobal: true, ttl: 60 * 60 * 1000 }),
    ChargerModule,
    ConfigurationModule.registerAsync(GoogleSecretService),
    FirebaseModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          googleApplicationCredential: {
            projectId: configService.getOrThrow('FIREBASE_PROJECT_ID'),
            client_email: configService.getOrThrow('FIREBASE_CLIENT_EMAIL'),
            private_key: configService.getOrThrow('FIREBASE_PRIVATE_KEY'),
          },
        };
      },
    }),
    OpensearchModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          node: configService.getOrThrow('OPENSEARCH_URL'),
          auth: {
            username: configService.getOrThrow('OPENSEARCH_USERNAME'),
            password: configService.getOrThrow('OPENSEARCH_PASSWORD'),
          },
        };
      },
    }),
    LogtailModule,
    ScheduleModule.forRoot(),
    SentryModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          dsn: configService.getOrThrow('SENTRY_DSN'),
          environment: configService.getOrThrow('NODE_ENV'),
          tracesSampleRate: 1.0,
          release: `star-ev@${packageJson.version}`,
        };
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10,
        },
      ],
    }),
    UserModule,
    VoucherModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () =>
        new SentryInterceptor({
          filters: [
            {
              type: HttpException,
              filter: (exception: HttpException) => 500 > exception.getStatus(),
            },
          ],
        }),
    },
  ],
})
export class AppModule {}
