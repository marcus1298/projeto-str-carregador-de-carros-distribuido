import { ChargerZone, ChargerZonePathFactory } from '@/entities/charger-zone.entity';
import { DocumentReference } from '@google-cloud/firestore';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, LoggerService } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FirebaseAdmin, InjectFirebaseAdmin } from '@star-ev/nestjs-config';
import { Cache } from 'cache-manager';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { GetZoneQuery } from '../types/zone.query';

@QueryHandler(GetZoneQuery)
export class GetZoneQueryHandler implements IQueryHandler<GetZoneQuery> {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async execute(
    query: GetZoneQuery,
  ): Promise<ChargerZone | DocumentReference<ChargerZone> | undefined> {
    const { uid, getRef, cache } = query.args;

    const chargerZonePath = ChargerZonePathFactory.create(uid);

    const chargerZoneRef = this.firebase.db.doc(chargerZonePath) as DocumentReference<ChargerZone>;

    if (getRef) {
      return chargerZoneRef;
    }

    try {
      let chargerZone = await this.cacheManager.get<ChargerZone>(chargerZonePath);

      if (!chargerZone || cache === false) {
        chargerZone = (await chargerZoneRef.get()).data();

        if (!chargerZone) {
          return undefined;
        }

        await this.cacheManager.set(chargerZonePath, chargerZone);
      }

      return chargerZone;
    } catch (e) {
      this.logger.error(`GetStationFirestoreQueryHandler - Error`, {
        query: {
          uid,
          getRef,
        },
        error: e.message,
        stack: 'GetStationFirestoreQueryHandler.execute',
      });

      return undefined;
    }
  }
}
