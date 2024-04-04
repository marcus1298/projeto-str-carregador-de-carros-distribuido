import { DocumentReference } from '@google-cloud/firestore';
import { User } from './user.entity';

export interface Voucher {
  id: string;
  registrationCode: string;
  registeredBy: DocumentReference<User>[];
  maxRegistrations?: number;
  totalRegistrations: number;
  globalUsages: number;
  maxGlobalUsages?: number;
  maxUsagesPerUser?: number;
  expiresAt?: number;
}

const VoucherBasePath = 'vouchers';

export class VoucherPathFactory {
  static create(args: { voucherId: string; }): string {
    const { voucherId } = args;
    return `${VoucherBasePath}/${voucherId}`;
  }
}