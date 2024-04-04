import { User, UserPathFactory, UserTransactionHistoryPathFactory, UserVoucherPathFactory } from '@/entities/user.entity';
import { Voucher, VoucherPathFactory } from '@/entities/voucher.entity';
import { DocumentReference } from '@google-cloud/firestore';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, LoggerService } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FirebaseAdmin, InjectFirebaseAdmin } from '@star-ev/nestjs-config';
import { Cache } from 'cache-manager';
import * as Firebase from 'firebase-admin';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ActivateVoucherQuery, AddUserTransactionHistoryQuery, GetUserQuery } from '../types/user.query';

@QueryHandler(GetUserQuery)
export class GetUserQueryHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) { }

  async execute(
    query: GetUserQuery,
  ): Promise<User | DocumentReference<User> | undefined> {
    const { uid, getRef, cache } = query.args;

    const userPath = UserPathFactory.create({ uid });

    const userRef = this.firebase.db.doc(
      userPath,
    ) as DocumentReference<User>;

    if (getRef) {
      return userRef;
    }

    try {
      let user = await this.cacheManager.get<User>(userPath);

      if (!user || cache === false) {
        user = (await userRef.get()).data() as User;

        await this.cacheManager.set(userPath, user);
      }

      return user;
    } catch (e) {
      this.logger.error(`GetUserQueryHandler - Error`, {
        query: {
          uid,
          getRef,
        },
        error: e.message,
        stack: 'GetUserQueryHandler.execute',
      });

      return undefined;
    }
  }
}

@QueryHandler(AddUserTransactionHistoryQuery)
export class AddUserTransactionHistoryQueryHandler implements IQueryHandler<AddUserTransactionHistoryQuery> {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) { }

  async execute(
    query: AddUserTransactionHistoryQuery,
  ): Promise<User | DocumentReference<User> | undefined> {
    const { uid, transactionId, status, voucherId } = query.args;

    const transactionPath = UserTransactionHistoryPathFactory.create(query.args);

    try {
      const ref = this.firebase.db.doc(transactionPath);

      await this.firebase.db.doc(transactionPath).set({
        id: transactionId,
        ref,
        status,
        voucherId,
        createdAt: Date.now(),
      }, { mergeFields: ['status'] });
    } catch (e) {
      this.logger.error(`GetUserQueryHandler - Error`, {
        query: {
          uid,
          transactionId
        },
        error: e.message,
        stack: 'GetUserQueryHandler.execute',
      });

      return undefined;
    }
  }
}

@QueryHandler(ActivateVoucherQuery)
export class ActivateVoucherQueryHandler implements IQueryHandler<ActivateVoucherQuery> {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) { }

  async execute(
    query: ActivateVoucherQuery,
  ): Promise<any> {
    const { uid, registrationCode } = query.args;

    const voucherSnap = await this.firebase.db.collection('vouchers').where("registrationCode", "==", registrationCode).limit(1).get();

    if (voucherSnap.empty) return { error: 'Voucher não encontrado.' };

    const voucherDoc = voucherSnap.docs[0];
    const voucherId = voucherDoc.id;
    const voucher = voucherDoc.data() as Voucher;

    if (voucher.expiresAt && voucher.expiresAt < Date.now()) return { error: 'Voucher expirado.' };

    if (voucher.maxRegistrations && voucher.totalRegistrations >= voucher.maxRegistrations) return { error: 'Voucher esgotado.' };

    const voucherPath = VoucherPathFactory.create({ voucherId });
    const userPath = UserPathFactory.create({ uid });

    const userVoucherPath = UserVoucherPathFactory.create({ uid, voucherId });

    try {
      await this.firebase.db.runTransaction(async (transaction) => {

        const voucherRef = this.firebase.db.doc(voucherPath);
        const userRef = this.firebase.db.doc(userPath);

        transaction.update(voucherRef, {
          registeredBy: Firebase.firestore.FieldValue.arrayUnion(userRef),
        });

        transaction.set(this.firebase.db.doc(userVoucherPath), {
          id: voucherId,
          ref: voucherRef,
          registrationCode,
          maxUsages: voucher.maxUsagesPerUser,
          totalUsages: 0
        }, { mergeFields: ['maxUsages'] });
      });

      return { success: true };
    } catch (e) {
      this.logger.error(`ActivateVoucherQuery - Error`, {
        query: {
          uid,
          voucherId,
        },
        error: e.message,
        stack: 'ActivateVoucherQuery.execute',
      });

      throw e;
    }
  }
}
