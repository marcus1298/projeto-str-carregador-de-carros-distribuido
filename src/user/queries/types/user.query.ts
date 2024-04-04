export class GetUserQuery {
  constructor(readonly args: { uid: string; getRef?: boolean; cache?: boolean }) { }
}

export class AddUserTransactionHistoryQuery {
  constructor(readonly args: { uid: string; transactionId: string, status: string, voucherId?: string }) { }
}

export class ActivateVoucherQuery {
  constructor(readonly args: { uid: string; registrationCode: string }) { }
}