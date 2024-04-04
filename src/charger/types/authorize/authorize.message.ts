import { OCPPResponse } from "@/types/ocpp/call-result";

export class AuthorizeRequest {
  idTag: string;
}

export enum AuthorizeStatus {
  ACCEPTED = 'Accepted',
  BLOCKED = 'Blocked',
  EXPIRED = 'Expired',
  INVALID = 'Invalid',
  CONCURRENTTX = 'ConcurrentTx',
}

class IdTagInfo {
  status: AuthorizeStatus;
  expiryDate?: Date;
  parentIdTag?: string;
}
export class AuthorizeResponse extends OCPPResponse {
  idTagInfo: IdTagInfo;

  constructor(uniqueId: string, idTagInfo: IdTagInfo) {
    super(uniqueId);

    this.idTagInfo = idTagInfo;
  }

  static createAccepted(uniqueId: string, expiryDate: Date) {
    return new AuthorizeResponse(uniqueId, {
      status: AuthorizeStatus.ACCEPTED,
      expiryDate,
    }).createResult();
  }
}
