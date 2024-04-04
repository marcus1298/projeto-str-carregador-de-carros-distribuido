export enum DiagnosticsStatus {
  Idle = 'Idle',
  Uploaded = 'Uploaded',
  UploadFailed = 'UploadFailed',
  Uploading = 'Uploading',
}

export class DiagnosticsStatusNotificationMessage {
  status: DiagnosticsStatus;
  startTime?: string;
  endTime?: string;
  statusInfo?: string;
}

export class DiagnosticsUploadMessage {
  location: string;
  retrieveDate: string;
  retryInterval?: number;
  retryIntervalMultiplier?: number;
  requestTransfer?: boolean;
}

export class GetDiagnosticsMessage {
  location: string;
  startTime?: string;
  stopTime?: string;
  retries?: number;
  retryInterval?: number;
  retryIntervalMultiplier?: number;
}