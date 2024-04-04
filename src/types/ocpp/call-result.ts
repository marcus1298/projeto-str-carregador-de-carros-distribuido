import { OCPPMessageType } from './message-type.enum';

export enum OCPPResponseErrorCode {
  INTERNAL_ERROR = 'InternalError',
  NOT_IMPLEMENTED = 'NotImplemented',
  NOT_SUPPORTED = 'NotSupported',
  PROTOCOL_ERROR = 'ProtocolError',
}

export type OCPPCallErrorMessage = [OCPPMessageType, string, OCPPResponseErrorCode, string?];
export type OCPPCallResultMessage = [OCPPMessageType, string, OCPPResponse];

export class OCPPResponse implements Record<string, any> {
  constructor(public uniqueId: string) { }

  public createResult(payload?: any): OCPPCallResultMessage {
    const uniqueId = this.uniqueId;
    delete this.uniqueId;
    return [OCPPMessageType.CALLRESULT, uniqueId, payload ?? this ?? {}];
  }

  static createError(
    uniqueId: string,
    code: OCPPResponseErrorCode,
    description = '',
  ): OCPPCallErrorMessage {
    return [OCPPMessageType.CALLERROR, uniqueId, code, description];
  }
}