import { UserVoucher, UserVoucherPathFactory } from '@/entities/user.entity';
import { Voucher, VoucherPathFactory } from '@/entities/voucher.entity';
import { DocumentReference } from '@google-cloud/firestore';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, LoggerService } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FirebaseAdmin, InjectFirebaseAdmin } from '@star-ev/nestjs-config';
import { Cache } from 'cache-manager';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { GetUserVoucherQuery, GetVoucherQuery } from '../types/voucher.query';

@QueryHandler(GetVoucherQuery)
export class GetVoucherQueryHandler implements IQueryHandler<GetVoucherQuery> {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) { }

  async execute(
    query: GetVoucherQuery,
  ): Promise<Voucher | DocumentReference<Voucher> | undefined> {
    const { voucherId, getRef, cache } = query.args;

    const voucherPath = VoucherPathFactory.create(query.args);

    const voucherRef = this.firebase.db.doc(
      voucherPath,
    ) as DocumentReference<Voucher>;

    if (getRef) {
      return voucherRef;
    }

    try {
      let voucher = await this.cacheManager.get<Voucher>(voucherPath);

      if (!voucher || cache === false) {
        voucher = (await voucherRef.get()).data() as Voucher;

        await this.cacheManager.set(voucherPath, voucher);
      }

      return voucher;
    } catch (e) {
      this.logger.error(`GetVoucherQueryHandler - Error`, {
        query: {
          voucherId,
          getRef,
        },
        error: e.message,
        stack: 'GetVoucherQueryHandler.execute',
      });

      return undefined;
    }
  }
}
@QueryHandler(GetUserVoucherQuery)
export class GetUserVoucherQueryHandler implements IQueryHandler<GetUserVoucherQuery> {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) { }

  async execute(
    query: GetUserVoucherQuery,
  ): Promise<UserVoucher | DocumentReference<UserVoucher> | undefined> {
    const { voucherId, getRef, cache } = query.args;

    const userVoucherPath = UserVoucherPathFactory.create(query.args);

    const userVoucherRef = this.firebase.db.doc(
      userVoucherPath,
    ) as DocumentReference<UserVoucher>;

    if (getRef) {
      return userVoucherRef;
    }

    try {
      let userVoucher = await this.cacheManager.get<UserVoucher>(userVoucherPath);

      if (!userVoucher || cache === false) {
        userVoucher = (await userVoucherRef.get()).data() as UserVoucher;

        await this.cacheManager.set(userVoucherPath, userVoucher);
      }

      return userVoucher;
    } catch (e) {
      this.logger.error(`GetUserVoucherQuery - Error`, {
        query: {
          voucherId,
          getRef,
        },
        error: e.message,
        stack: 'GetUserQueryHandler.execute',
      });

      return undefined;
    }
  }
}