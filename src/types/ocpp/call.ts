import { randomUUID } from 'crypto';
import { OCPPMessageType } from './message-type.enum';

export type OCPPCallMessage = [OCPPMessageType, string, string, OCPPCall];

export class OCPPRequest<T> {
  constructor(public uniqueId: string, public payload: T) { }
}

export class OCPPCall {
  private uniqueId: string;

  constructor(public action: string, uniqueId?: string | number) {
    this.uniqueId = `${action}::${uniqueId ?? randomUUID()}`;
  }

  public create(): OCPPCallMessage {
    const { uniqueId, action } = this;
    const payload = { ...this };
    delete payload.uniqueId;
    delete payload.action;
    return [OCPPMessageType.CALL, uniqueId, action, payload];
  }
}