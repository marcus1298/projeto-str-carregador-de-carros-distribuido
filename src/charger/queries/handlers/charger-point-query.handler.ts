import {
  ChargerPoint,
  ChargerPointPathFactory,
  ChargerPointStatus,
} from '@/entities/charger-point.entity';
import { Transaction } from '@/entities/transaction.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, LoggerService } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FirebaseAdmin, InjectFirebaseAdmin } from '@star-ev/nestjs-config';
import { Cache } from 'cache-manager';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  GetChargerPointCurrentTransactionQuery,
  UpdateChargerPointQuery,
} from '../types/connector.query';

@QueryHandler(UpdateChargerPointQuery)
export class UpdateChargerPointQueryHandler implements IQueryHandler<UpdateChargerPointQuery> {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async execute(query: UpdateChargerPointQuery): Promise<boolean> {
    const { status } = query.args;

    const chargerPointPath = ChargerPointPathFactory.create(query.args);

    try {
      await this.firebase.db.runTransaction(async (t) => {
        const chargerPointRef = this.firebase.db.doc(chargerPointPath);

        const update = {
          status: String(status).toUpperCase() as ChargerPointStatus,
        };

        switch (update.status) {
          case ChargerPointStatus.AVAILABLE:
            await this.cacheManager.del(`${chargerPointPath}::currentTransaction`);
            update['currentTransaction'] = null;
            break;
          case ChargerPointStatus.FINISHING:
            await this.cacheManager.del(`${chargerPointPath}::currentTransaction`);
            update['currentTransaction'] = null;
            break;
          default:
            break;
        }

        t.update(chargerPointRef, update);
      });
    } catch (e) {
      this.logger.error(`UpdateTransactionQueryHandler - Error`, {
        query: {
          chergerPointPath: chargerPointPath,
          status,
        },
        error: e.message,
        stack: 'UpdateTransactionQueryHandler.execute',
      });

      return undefined;
    }
  }
}

@QueryHandler(GetChargerPointCurrentTransactionQuery)
export class GetChargerPointCurrentTransactionHandler
  implements IQueryHandler<GetChargerPointCurrentTransactionQuery>
{
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async execute(query: GetChargerPointCurrentTransactionQuery): Promise<Transaction> {
    const chargerPointPath = ChargerPointPathFactory.create(query.args);

    try {
      let transaction = await this.cacheManager.get<Transaction>(
        `${chargerPointPath}::currentTransaction`,
      );

      if (!transaction) {
        const chargerPoint = (
          await this.firebase.db.doc(chargerPointPath).get()
        ).data() as ChargerPoint;

        if (chargerPoint.currentTransaction)
          transaction = (await chargerPoint.currentTransaction?.get()).data();
      }

      if (!transaction) {
        return undefined;
      }

      await this.cacheManager.set(
        `${chargerPointPath}::currentTransaction`,
        transaction,
        12 * 60 * 60 * 1000,
      );

      return transaction;
    } catch (e) {
      this.logger.error(`GetChargerPointCurrentTransactionQuery - Error`, {
        query: {
          chargerPointPath,
        },
        error: e.message,
        stack: 'GetChargerPointCurrentTransactionQuery.execute',
      });

      return undefined;
    }
  }
}
