import { OCPPResponse } from "@/types/ocpp/call-result";

export class BootNotificationRequest {
  chargePointVendor: string;
  chargePointModel: string;
  chargePointSerialNumber: string;
  chargeBoxSerialNumber: string;
  firmwareVersion: string;
  iccid: string;
  imsi: string;
  meterType: string;
  meterSerialNumber: string;
}

export enum BootNotificationResponseStatus {
  ACCEPTED = 'Accepted',
  PENDING = 'Pending',
  REJECTED = 'Rejected',
}

export class BootNotificationResponse extends OCPPResponse {
  status: BootNotificationResponseStatus;
  currentTime: string;
  interval: number;

  constructor(
    uniqueId: string,
    interval: number,
    status: BootNotificationResponseStatus = BootNotificationResponseStatus.ACCEPTED,
  ) {
    super(uniqueId);

    this.interval = interval;
    this.status = status;
    this.currentTime = new Date().toJSON();
  }
}
