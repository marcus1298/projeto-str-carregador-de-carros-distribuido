import {
  ChargerPoint,
  ChargerPointPathFactory,
  ChargerPointStatus,
} from '@/entities/charger-point.entity';
import { ChargerStation } from '@/entities/charger-station.entity';
import { Transaction, TransactionBasePath, TransactionStatus } from '@/entities/transaction.entity';
import { UserVoucherPathFactory } from '@/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, LoggerService } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { FirebaseAdmin, InjectFirebaseAdmin } from '@star-ev/nestjs-config';
import { Cache } from 'cache-manager';
import * as Firebase from 'firebase-admin';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { GetChargerPointCurrentTransactionQuery } from '../types/connector.query';
import { GetStationQuery } from '../types/station.query';
import {
  AddTransactionDataQuery,
  CreateTransactionQuery,
  UpdateTransactionQuery,
} from '../types/transaction.query';

@QueryHandler(CreateTransactionQuery)
export class CreateTransactionQueryHandler implements IQueryHandler<CreateTransactionQuery> {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async execute(query: CreateTransactionQuery) {
    const { meterStart, voucherId, user } = query.args;

    const chargerPointPath = ChargerPointPathFactory.create(query.args);

    try {
      const chargerPointRef = this.firebase.db.doc(chargerPointPath);

      const userRef = this.firebase.db.doc(`users/${user.id}`);

      const point = (await chargerPointRef.get()).data() as ChargerPoint;

      const isNotAvailable =
        ![ChargerPointStatus.AVAILABLE, ChargerPointStatus.PREPARING].includes(point.status) ||
        !!point.currentTransaction;

      if (isNotAvailable) {
        throw new Error('Charger point is not available');
      }

      return await this.firebase.db.runTransaction(async (t) => {
        const now = Date.now();

        const id = Number(String(now) + Math.floor(Math.random() * 898 + 101));

        const transactionRef = this.firebase.db.doc(
          `${chargerPointPath}/${TransactionBasePath}/${id}`,
        );

        let voucherDetails = {};

        if (voucherId) {
          const voucherRef = this.firebase.db.doc(`vouchers/${voucherId}`);
          voucherDetails = {
            voucherId,
            voucherRef,
          };
        }

        t.create(transactionRef, {
          id,
          userRef,
          pointRef: chargerPointRef,
          status: TransactionStatus.INITIALIZING,
          meterStart,
          ...voucherDetails,
          current: 0,
          createdAt: now,
        });

        return id;
      });
    } catch (e) {
      this.logger.error(`CreateTransactionQueryHandler - Error`, {
        query: {
          chargerPointPath,
        },
        error: e.message,
        stack: 'CreateTransactionQueryHandler.execute',
      });

      return undefined;
    }
  }
}

@QueryHandler(UpdateTransactionQuery)
export class UpdateTransactionQueryHandler implements IQueryHandler<UpdateTransactionQuery> {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: UpdateTransactionQuery) {
    let { id, meterStart, meterStop, status, stationId, pointId } = query.args;
    let chargerPointPath;
    try {
      if (!id && !pointId) return;

      if (id && !pointId) {
        const station = await this.queryBus.execute<GetStationQuery, ChargerStation>(
          new GetStationQuery({ uid: stationId, cache: false }),
        );

        const chargerPoint = station.points.find((point) => point.currentTransaction?.id === id);

        if (!chargerPoint) return;

        chargerPointPath = ChargerPointPathFactory.create({ stationId, pointId: chargerPoint.id });
      } else if (!id) {
        chargerPointPath = ChargerPointPathFactory.create(query.args);

        const transaction = await this.queryBus.execute<
          GetChargerPointCurrentTransactionQuery,
          Transaction
        >(new GetChargerPointCurrentTransactionQuery({ stationId, pointId }));

        if (!transaction) {
          return;
        }

        id = transaction.id;
      } else {
        chargerPointPath = ChargerPointPathFactory.create(query.args);
      }

      const chargerPointRef = this.firebase.db.doc(chargerPointPath);

      let transactionRef = this.firebase.db.doc(`${chargerPointPath}/${TransactionBasePath}/${id}`);

      await this.firebase.db.runTransaction(async (t) => {
        let transactionUpdate = {
          status,
          meterStart,
          meterStop,
          updatedAt: Date.now(),
        };

        Object.keys(transactionUpdate).forEach(
          (key) =>
            (transactionUpdate[key] == null || transactionUpdate[key] === undefined) &&
            delete transactionUpdate[key],
        );

        t.update(transactionRef, transactionUpdate);

        switch (status) {
          case TransactionStatus.STOPPED:
            t.update(chargerPointRef, {
              currentTransaction: null,
            });
            break;
          case TransactionStatus.WAITING:
            t.update(chargerPointRef, {
              currentTransaction: transactionRef,
            });
            break;
        }
      });

      const transaction = (await transactionRef.get()).data();

      switch (status) {
        case TransactionStatus.STOPPED:
          await this.cacheManager.del(`${chargerPointPath}::currentTransaction`);
        case TransactionStatus.WAITING:
          await this.cacheManager.set(
            `${chargerPointPath}::currentTransaction`,
            transaction,
            12 * 60 * 60 * 1000,
          );
      }
    } catch (e) {
      this.logger.error(`UpdateTransactionQueryHandler - Error`, {
        query: {
          chargerPointPath,
          transactionId: id,
          meterStart,
          meterStop,
        },
        error: e.message,
        stack: 'UpdateTransactionQueryHandler.execute',
      });

      return undefined;
    }
  }
}
@QueryHandler(AddTransactionDataQuery)
export class AddTransactionDataQueryHandler implements IQueryHandler<AddTransactionDataQuery> {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: AddTransactionDataQuery) {
    const { stationId, pointId, data } = query.args;

    const transaction = await this.queryBus.execute<
      GetChargerPointCurrentTransactionQuery,
      Transaction
    >(new GetChargerPointCurrentTransactionQuery({ stationId, pointId }));

    if (!transaction) {
      return;
    }

    const chargerPointPath = ChargerPointPathFactory.create(query.args);

    let transactionRef = this.firebase.db.doc(
      `${chargerPointPath}/${TransactionBasePath}/${transaction.id}`,
    );

    try {
      await this.firebase.db.runTransaction(async (t) => {
        const { voucherId, voucherRef } = transaction;

        if (voucherId) {
          const { userRef } = transaction;
          const userVoucherPath = UserVoucherPathFactory.create({
            uid: userRef.id,
            voucherId: transaction.voucherId,
          });
          const userVoucherRef = this.firebase.db.doc(userVoucherPath);
          t.update(userVoucherRef, {
            totalUsages: Firebase.firestore.FieldValue.increment(1),
          });
          t.update(voucherRef, {
            globalUsages: Firebase.firestore.FieldValue.increment(1),
          });
        }

        t.update(transactionRef, {
          data: Firebase.firestore.FieldValue.arrayUnion(...JSON.parse(JSON.stringify(data))),
        });
      });
    } catch (e) {
      this.logger.error(`AddTransactionDataQuery - Error`, {
        query: {
          chargerPointPath,
          transactionId: transaction.id,
          data,
        },
        error: e.message,
        stack: 'AddTransactionDataQuery.execute',
      });

      return undefined;
    }
  }
}
