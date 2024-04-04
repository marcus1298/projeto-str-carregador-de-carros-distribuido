import { ChargerPointStatus } from "@/entities/charger-point.entity";
import { OCPPResponse } from "@/types/ocpp/call-result";

export enum ChargePointErrorCodes {
  CONNECTORLOCKFAILURE = 'CONNECTOR_LOCK_FAILURE',
  EVCOMMUNICATIONERROR = 'EV_COMMUNICATION_ERROR',
  GROUNDFAILURE = 'GROUND_FAILURE',
  HIGHTEMPERATURE = 'HIGH_TEMPERATURE',
  INTERNALERROR = 'INTERNAL_ERROR',
  LOCALLISTCONFLICT = 'LOCAL_LIST_CONFLICT',
  NOERROR = 'NO_ERROR',
  OTHERERROR = 'OTHER_ERROR',
  OVERCURRENTFAILURE = 'OVER_CURRENT_FAILURE',
  POWERMETERFAILURE = 'POWER_METER_FAILURE',
  POWERSWITCHFAILURE = 'POWER_SWITCH_FAILURE',
  READERFAILURE = 'READER_FAILURE',
  RESETFAILURE = 'RESET_FAILURE',
  UNDERVOLTAGE = 'UNDER_VOLTAGE',
  OVERVOLTAGE = 'OVER_VOLTAGE',
  WEAKSIGNAL = 'WEAK_SIGNAL',
}

export class StatusNotificationRequest {
  connectorId: number;
  errorCode: ChargePointErrorCodes;
  status: ChargerPointStatus;
  info?: any;
  timestamp?: string;
}

export class StatusNotificationResponse extends OCPPResponse {
  constructor(uniqueId: string) {
    super(uniqueId);
  }
}