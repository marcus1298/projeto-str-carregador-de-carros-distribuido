interface BasicInfo {
  displayName: string;
  email: string;
  phone: string;
  birthDate?: Date;
}

export enum UserRole {
  PEIXE = 'PEIXE',
  USER = 'USER',
}

interface Settings {
  isPrivacyPolicyConfirmed: boolean;
  isGeolocalizationPermitted: boolean;
  isPushNotificationEnabled: boolean;
  isVibrationEnabled: boolean;
}

export interface User {
  id: string;
  fcmToken: string;
  userInformation: BasicInfo;
  userSettings: Settings;
  metadata?: Record<string, any>;
}


export interface UserVoucher {
  id: string;
  registrationCode: string;
  totalUsages: number;
  maxUsages?: number;
  expiresAt?: number;
}


const UserBasePath = 'users';
const UserTransactionHistoryBasePath = 'transactions';
const UserVouchersBasePath = 'vouchers';

export class UserPathFactory {
  static create(args: { uid: string; }): string {
    const { uid } = args;
    return `${UserBasePath}/${uid}`;
  }
}

export class UserTransactionHistoryPathFactory {
  static create(args: { uid: string; transactionId: string }): string {
    const { uid, transactionId } = args;
    return `${UserBasePath}/${uid}/${UserTransactionHistoryBasePath}/${transactionId}`;
  }
}

export class UserVoucherPathFactory {
  static create(args: { uid: string; voucherId: string; }): string {
    const { uid, voucherId } = args;
    return `${UserBasePath}/${uid}/${UserVouchersBasePath}/${voucherId}`;
  }
}