export class GetVoucherQuery {
  constructor(readonly args: { voucherId: string; getRef?: boolean; cache?: boolean }) { }
}

export class GetUserVoucherQuery {
  constructor(readonly args: { uid: string; voucherId: string; getRef?: boolean; cache?: boolean }) { }
}
