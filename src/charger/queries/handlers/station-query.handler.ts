import { ChargerPoint, ChargerPointBasePath } from '@/entities/charger-point.entity';
import { ChargerStation, ChargerStationPathFactory } from '@/entities/charger-station.entity';
import { DocumentReference } from '@google-cloud/firestore';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, LoggerService } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { FirebaseAdmin, InjectFirebaseAdmin } from '@star-ev/nestjs-config';
import { Cache } from 'cache-manager';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { GetStationQuery, UpdateStationStatusQuery } from '../types/station.query';

@QueryHandler(GetStationQuery)
export class GetStationQueryHandler implements IQueryHandler<GetStationQuery> {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async execute(
    query: GetStationQuery,
  ): Promise<ChargerStation | DocumentReference<ChargerStation> | undefined> {
    const { uid, getRef, cache } = query.args;

    const chargerStationPath = ChargerStationPathFactory.create(uid);

    const chargerStationRef = this.firebase.db.doc(
      chargerStationPath,
    ) as DocumentReference<ChargerStation>;

    if (getRef) {
      return chargerStationRef;
    }

    try {
      let chargerStation = await this.cacheManager.get<ChargerStation>(chargerStationPath);

      if (!chargerStation || cache === false) {
        chargerStation = (await chargerStationRef.get()).data() as ChargerStation;

        if (!chargerStation) {
          return undefined;
        }

        chargerStation.points = (
          await chargerStationRef.collection(ChargerPointBasePath).get()
        ).docs.map((doc) => doc.data()) as ChargerPoint[];

        await this.cacheManager.set(chargerStationPath, chargerStation);
      }

      return chargerStation;
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

@QueryHandler(UpdateStationStatusQuery)
export class UpdateStationStatusQueryHandler implements IQueryHandler<UpdateStationStatusQuery> {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private queryBus: QueryBus,
  ) {}

  async execute(query: UpdateStationStatusQuery): Promise<ChargerStation | undefined> {
    const { uid, status } = query.args;

    const chargerStationPath = ChargerStationPathFactory.create(uid);

    try {
      await this.firebase.db.runTransaction(async (t) => {
        const chargerStationRef = this.firebase.db.doc(chargerStationPath);

        t.update(chargerStationRef, {
          status,
        });
      });

      return await this.queryBus.execute(new GetStationQuery({ uid, cache: false }));
    } catch (e) {
      this.logger.error(`UpdateStationStatusQueryHandler - Error`, {
        query: {
          uid,
          status,
        },
        error: e.message,
        stack: 'UpdateStationStatusQueryHandler.execute',
      });

      return undefined;
    }
  }
}
