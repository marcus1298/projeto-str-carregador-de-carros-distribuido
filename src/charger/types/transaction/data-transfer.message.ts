import { OCPPResponse } from "@/types/ocpp/call-result";

export class DataTransferRequest {
  vendorId: string;
  messageId: string;
  data: string;
}

export class DataTransferResponse extends OCPPResponse {
  constructor(uniqueId: string) {
    super(uniqueId);
  }

  static createAccepted(uniqueId: string) {
    return new DataTransferResponse(uniqueId).createResult({
      status: 'Accepted',
    });
  }
}
